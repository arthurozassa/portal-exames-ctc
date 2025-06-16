const Database = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../middleware/security');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const multer = require('multer');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/exams');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `exam-${req.params.examId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /\.(pdf|jpg|jpeg|png|dicom|doc|docx)$/i;
        if (allowedTypes.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'), false);
        }
    }
});

class ExamController {
    // Listar exames do paciente
    static async getPatientExams(req, res) {
        try {
            const patientId = req.user.id;
            const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;
            
            let whereConditions = ['e.patient_id = ?'];
            let params = [patientId];
            
            // Filtros opcionais
            if (type) {
                whereConditions.push('e.exam_type LIKE ?');
                params.push(`%${type}%`);
            }
            
            if (status) {
                whereConditions.push('e.status = ?');
                params.push(status);
            }
            
            if (startDate) {
                whereConditions.push('e.exam_date >= ?');
                params.push(startDate);
            }
            
            if (endDate) {
                whereConditions.push('e.exam_date <= ?');
                params.push(endDate);
            }
            
            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * limit;
            
            // Buscar exames
            const exams = await Database.query(`
                SELECT 
                    e.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm,
                    COUNT(ev.id) as has_values
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                LEFT JOIN exam_values ev ON e.id = ev.exam_id
                WHERE ${whereClause}
                GROUP BY e.id
                ORDER BY e.exam_date DESC, e.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            // Contar total
            const totalResult = await Database.query(`
                SELECT COUNT(DISTINCT e.id) as total
                FROM exams e
                WHERE ${whereClause}
            `, params);
            
            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Log de auditoria
            logAuditEvent(req, 'view_exams', 'exam', null, {
                filters: { type, status, startDate, endDate },
                page,
                limit
            });
            
            res.json({
                success: true,
                data: {
                    exams,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar exames:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Obter detalhes de um exame específico
    static async getExamDetails(req, res) {
        try {
            const { examId } = req.params;
            const patientId = req.user.id;
            
            // Buscar exame
            const exams = await Database.query(`
                SELECT 
                    e.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm,
                    d.specialty as doctor_specialty
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.id = ? AND e.patient_id = ?
            `, [examId, patientId]);
            
            if (exams.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exame não encontrado'
                });
            }
            
            const exam = exams[0];
            
            // Buscar valores do exame (para gráficos)
            const values = await Database.query(`
                SELECT *
                FROM exam_values
                WHERE exam_id = ?
                ORDER BY parameter_name
            `, [examId]);
            
            // Buscar compartilhamentos ativos
            const shares = await Database.query(`
                SELECT 
                    es.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exam_shares es
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.exam_id = ? AND es.is_active = true
                ORDER BY es.shared_at DESC
            `, [examId]);
            
            // Log de auditoria
            logAuditEvent(req, 'view_exam_details', 'exam', examId, {
                examType: exam.exam_type,
                examDate: exam.exam_date
            });
            
            res.json({
                success: true,
                data: {
                    exam,
                    values,
                    shares
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar detalhes do exame:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Compartilhar exame com médico
    static async shareExam(req, res) {
        try {
            const { examId } = req.params;
            const { doctorCrm, message } = req.body;
            const patientId = req.user.id;
            
            if (!doctorCrm) {
                return res.status(400).json({
                    success: false,
                    message: 'CRM do médico é obrigatório'
                });
            }
            
            // Verificar se o exame pertence ao paciente
            const exams = await Database.query(
                'SELECT * FROM exams WHERE id = ? AND patient_id = ?',
                [examId, patientId]
            );
            
            if (exams.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exame não encontrado'
                });
            }
            
            // Buscar médico pelo CRM
            const doctors = await Database.query(
                'SELECT * FROM doctors WHERE crm = ? AND is_active = true',
                [doctorCrm]
            );
            
            if (doctors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Médico não encontrado com este CRM'
                });
            }
            
            const doctor = doctors[0];
            
            // Verificar se já existe compartilhamento ativo
            const existingShares = await Database.query(`
                SELECT * FROM exam_shares 
                WHERE exam_id = ? AND doctor_id = ? AND is_active = true AND expires_at > NOW()
            `, [examId, doctor.id]);
            
            if (existingShares.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Este exame já está compartilhado com este médico'
                });
            }
            
            // Gerar token único e data de expiração (7 dias)
            const token = uuidv4();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            // Criar compartilhamento
            const result = await Database.query(`
                INSERT INTO exam_shares (exam_id, doctor_id, patient_id, token, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `, [examId, doctor.id, patientId, token, expiresAt]);
            
            // Log de auditoria
            logAuditEvent(req, 'share_exam', 'exam', examId, {
                doctorCrm: doctor.crm,
                doctorName: doctor.name,
                token,
                expiresAt: expiresAt.toISOString(),
                message
            });
            
            // Simular envio de email/notificação
            console.log(`📧 Compartilhamento enviado para Dr. ${doctor.name} (${doctor.crm})`);
            console.log(`🔗 Link: ${process.env.FRONTEND_URL}/shared/${token}`);
            
            res.json({
                success: true,
                message: 'Exame compartilhado com sucesso',
                data: {
                    shareId: result.insertId,
                    doctor: {
                        name: doctor.name,
                        crm: doctor.crm
                    },
                    token,
                    expiresAt: expiresAt.toISOString(),
                    shareLink: `${process.env.FRONTEND_URL}/shared/${token}`
                }
            });
            
        } catch (error) {
            console.error('Erro ao compartilhar exame:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Revogar compartilhamento
    static async revokeShare(req, res) {
        try {
            const { shareId } = req.params;
            const patientId = req.user.id;
            
            // Verificar se o compartilhamento pertence ao paciente
            const shares = await Database.query(`
                SELECT es.*, d.name as doctor_name, d.crm as doctor_crm
                FROM exam_shares es
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.id = ? AND es.patient_id = ? AND es.is_active = true
            `, [shareId, patientId]);
            
            if (shares.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Compartilhamento não encontrado'
                });
            }
            
            const share = shares[0];
            
            // Revogar compartilhamento
            await Database.query(
                'UPDATE exam_shares SET is_active = false, revoked_at = NOW() WHERE id = ?',
                [shareId]
            );
            
            // Log de auditoria
            logAuditEvent(req, 'revoke_share', 'exam', share.exam_id, {
                shareId,
                doctorCrm: share.doctor_crm,
                doctorName: share.doctor_name
            });
            
            res.json({
                success: true,
                message: 'Compartilhamento revogado com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao revogar compartilhamento:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Listar compartilhamentos do paciente
    static async getPatientShares(req, res) {
        try {
            const patientId = req.user.id;
            
            const shares = await Database.query(`
                SELECT 
                    es.*,
                    e.exam_type,
                    e.exam_date,
                    d.name as doctor_name,
                    d.crm as doctor_crm,
                    d.specialty as doctor_specialty
                FROM exam_shares es
                JOIN exams e ON es.exam_id = e.id
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.patient_id = ? AND es.is_active = true
                ORDER BY es.shared_at DESC
            `, [patientId]);
            
            res.json({
                success: true,
                data: { shares }
            });
            
        } catch (error) {
            console.error('Erro ao buscar compartilhamentos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Visualizar exame compartilhado (via token público)
    static async viewSharedExam(req, res) {
        try {
            const { token } = req.params;
            
            const shares = await Database.query(`
                SELECT 
                    es.*,
                    e.*,
                    p.name as patient_name,
                    p.birth_date as patient_birth_date,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exam_shares es
                JOIN exams e ON es.exam_id = e.id
                JOIN patients p ON e.patient_id = p.id
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.token = ? AND es.is_active = true AND es.expires_at > NOW()
            `, [token]);
            
            if (shares.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Link de compartilhamento inválido ou expirado'
                });
            }
            
            const share = shares[0];
            
            // Buscar valores do exame
            const values = await Database.query(
                'SELECT * FROM exam_values WHERE exam_id = ? ORDER BY parameter_name',
                [share.exam_id]
            );
            
            // Registrar acesso
            await Database.query(
                'UPDATE exam_shares SET accessed_at = NOW() WHERE id = ?',
                [share.id]
            );
            
            res.json({
                success: true,
                data: {
                    exam: {
                        id: share.exam_id,
                        type: share.exam_type,
                        date: share.exam_date,
                        status: share.status,
                        unit: share.unit,
                        results: share.results,
                        observations: share.observations,
                        pdf_path: share.pdf_path,
                        pacs_link: share.pacs_link
                    },
                    patient: {
                        name: share.patient_name,
                        birth_date: share.patient_birth_date
                    },
                    doctor: {
                        name: share.doctor_name,
                        crm: share.doctor_crm
                    },
                    share: {
                        shared_at: share.shared_at,
                        expires_at: share.expires_at,
                        accessed_at: share.accessed_at
                    },
                    values
                }
            });
            
        } catch (error) {
            console.error('Erro ao visualizar exame compartilhado:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Obter dados para linha do tempo (gráficos)
    static async getTimelineData(req, res) {
        try {
            const patientId = req.user.id;
            const { parameter, months = 12 } = req.query;
            
            if (!parameter) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro é obrigatório'
                });
            }
            
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - parseInt(months));
            
            const data = await Database.query(`
                SELECT 
                    ev.value,
                    ev.unit,
                    ev.reference_min,
                    ev.reference_max,
                    ev.is_normal,
                    e.exam_date,
                    e.exam_type
                FROM exam_values ev
                JOIN exams e ON ev.exam_id = e.id
                WHERE e.patient_id = ? 
                    AND ev.parameter_name = ?
                    AND e.exam_date >= ?
                ORDER BY e.exam_date ASC
            `, [patientId, parameter, startDate.toISOString().split('T')[0]]);
            
            // Log de auditoria
            logAuditEvent(req, 'view_timeline', 'exam', null, {
                parameter,
                months,
                dataPoints: data.length
            });
            
            res.json({
                success: true,
                data: {
                    parameter,
                    months: parseInt(months),
                    timeline: data
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar dados da linha do tempo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Obter estatísticas do dashboard
    static async getDashboardStats(req, res) {
        try {
            const patientId = req.user.id;

            // Contar exames por status
            const examStats = await Database.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM exams 
                WHERE patient_id = ?
                GROUP BY status
            `, [patientId]);

            // Exames recentes (últimos 5)
            const recentExams = await Database.query(`
                SELECT 
                    e.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.patient_id = ?
                ORDER BY e.exam_date DESC
                LIMIT 5
            `, [patientId]);

            // Próximo exame agendado
            const nextExam = await Database.query(`
                SELECT 
                    e.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.patient_id = ? AND e.status = 'pending' AND e.exam_date > date('now')
                ORDER BY e.exam_date ASC
                LIMIT 1
            `, [patientId]);

            // Compartilhamentos ativos
            const activeShares = await Database.query(`
                SELECT COUNT(*) as count
                FROM exam_shares es
                JOIN exams e ON es.exam_id = e.id
                WHERE e.patient_id = ? AND es.is_active = true AND es.expires_at > datetime('now')
            `, [patientId]);

            // Últimos valores de exames para timeline rápida
            const latestValues = await Database.query(`
                SELECT 
                    ev.parameter_name,
                    ev.value,
                    ev.unit,
                    ev.reference_min,
                    ev.reference_max,
                    ev.is_normal,
                    e.exam_date
                FROM exam_values ev
                JOIN exams e ON ev.exam_id = e.id
                WHERE e.patient_id = ? AND ev.parameter_name IN ('Glicose', 'Colesterol Total', 'Hemoglobina')
                ORDER BY e.exam_date DESC
                LIMIT 10
            `, [patientId]);

            // Processar estatísticas
            let stats = {
                completed: 0,
                pending: 0,
                cancelled: 0,
                total: 0
            };

            examStats.forEach(stat => {
                stats[stat.status] = stat.count;
                stats.total += stat.count;
            });

            res.json({
                success: true,
                data: {
                    examStats: stats,
                    recentExams: recentExams.map(exam => ({
                        id: exam.id,
                        type: exam.exam_type,
                        date: exam.exam_date,
                        status: exam.status,
                        doctor: exam.doctor_name,
                        unit: exam.unit
                    })),
                    nextExam: nextExam.length > 0 ? {
                        id: nextExam[0].id,
                        type: nextExam[0].exam_type,
                        date: nextExam[0].exam_date,
                        doctor: nextExam[0].doctor_name,
                        unit: nextExam[0].unit
                    } : null,
                    activeShares: activeShares[0].count,
                    latestValues: latestValues.map(val => ({
                        parameter: val.parameter_name,
                        value: val.value,
                        unit: val.unit,
                        isNormal: val.is_normal,
                        date: val.exam_date,
                        referenceRange: `${val.reference_min} - ${val.reference_max}`
                    }))
                }
            });

        } catch (error) {
            console.error('Erro ao buscar estatísticas do dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Download do PDF do exame
    static async downloadExamPDF(req, res) {
        try {
            const { examId } = req.params;
            const patientId = req.user.id;

            // Verificar se o exame pertence ao paciente
            const exams = await Database.query(`
                SELECT e.*, d.name as doctor_name, d.crm as doctor_crm
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.id = ? AND e.patient_id = ?
            `, [examId, patientId]);

            if (exams.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exame não encontrado'
                });
            }

            const exam = exams[0];

            // Se existe um PDF salvo, retornar ele
            if (exam.pdf_path && fs.existsSync(exam.pdf_path)) {
                const filename = `exame_${exam.exam_type}_${exam.exam_date}.pdf`;
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                return res.sendFile(path.resolve(exam.pdf_path));
            }

            // Caso contrário, gerar PDF dinamicamente
            const doc = new PDFDocument();
            const filename = `exame_${exam.exam_type}_${exam.exam_date}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            doc.pipe(res);

            // Cabeçalho
            doc.fontSize(18).text('Portal de Exames CTC', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Relatório do Exame: ${exam.exam_type}`, { align: 'center' });
            doc.moveDown(2);

            // Informações do exame
            doc.fontSize(12);
            doc.text(`Data do Exame: ${new Date(exam.exam_date).toLocaleDateString('pt-BR')}`);
            doc.text(`Médico: ${exam.doctor_name || 'N/A'}`);
            doc.text(`CRM: ${exam.doctor_crm || 'N/A'}`);
            doc.text(`Status: ${exam.status}`);
            doc.text(`Unidade: ${exam.unit || 'N/A'}`);
            doc.moveDown();

            // Resultados
            if (exam.results) {
                doc.text('Resultados:', { underline: true });
                doc.text(exam.results);
                doc.moveDown();
            }

            // Observações
            if (exam.observations) {
                doc.text('Observações:', { underline: true });
                doc.text(exam.observations);
                doc.moveDown();
            }

            // Buscar valores laboratoriais
            const values = await Database.query(`
                SELECT * FROM exam_values WHERE exam_id = ? ORDER BY parameter_name
            `, [examId]);

            if (values.length > 0) {
                doc.text('Valores Laboratoriais:', { underline: true });
                doc.moveDown(0.5);
                
                values.forEach(val => {
                    doc.text(`${val.parameter_name}: ${val.value} ${val.unit || ''}`);
                    doc.text(`  Referência: ${val.reference_min} - ${val.reference_max}`);
                    doc.text(`  Status: ${val.is_normal ? 'Normal' : 'Alterado'}`);
                    doc.moveDown(0.3);
                });
            }

            // Rodapé
            doc.moveDown(2);
            doc.fontSize(8).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
            doc.text('Portal de Exames CTC - Documento gerado eletronicamente', { align: 'center' });

            doc.end();

            // Log de auditoria
            logAuditEvent(req, 'download_pdf', 'exam', examId, {
                examType: exam.exam_type,
                examDate: exam.exam_date
            });

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar PDF'
            });
        }
    }

    // Download de relatório em diferentes formatos
    static async downloadExamReport(req, res) {
        try {
            const { examId } = req.params;
            const { format = 'pdf' } = req.query;
            const patientId = req.user.id;

            // Verificar se o exame pertence ao paciente
            const exams = await Database.query(`
                SELECT e.*, d.name as doctor_name, d.crm as doctor_crm
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.id = ? AND e.patient_id = ?
            `, [examId, patientId]);

            if (exams.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exame não encontrado'
                });
            }

            const exam = exams[0];

            // Buscar valores laboratoriais
            const values = await Database.query(`
                SELECT * FROM exam_values WHERE exam_id = ? ORDER BY parameter_name
            `, [examId]);

            if (format === 'xlsx') {
                // Gerar Excel
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Relatório do Exame');

                // Cabeçalho
                worksheet.addRow(['Portal de Exames CTC']);
                worksheet.addRow([`Relatório: ${exam.exam_type}`]);
                worksheet.addRow([]);

                // Informações gerais
                worksheet.addRow(['Informações do Exame']);
                worksheet.addRow(['Data', new Date(exam.exam_date).toLocaleDateString('pt-BR')]);
                worksheet.addRow(['Médico', exam.doctor_name || 'N/A']);
                worksheet.addRow(['CRM', exam.doctor_crm || 'N/A']);
                worksheet.addRow(['Status', exam.status]);
                worksheet.addRow([]);

                // Valores laboratoriais
                if (values.length > 0) {
                    worksheet.addRow(['Valores Laboratoriais']);
                    worksheet.addRow(['Parâmetro', 'Valor', 'Unidade', 'Ref. Mín', 'Ref. Máx', 'Status']);
                    
                    values.forEach(val => {
                        worksheet.addRow([
                            val.parameter_name,
                            val.value,
                            val.unit || '',
                            val.reference_min,
                            val.reference_max,
                            val.is_normal ? 'Normal' : 'Alterado'
                        ]);
                    });
                }

                const filename = `relatorio_${exam.exam_type}_${exam.exam_date}.xlsx`;
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                
                await workbook.xlsx.write(res);
                res.end();

            } else if (format === 'csv') {
                // Gerar CSV
                const filename = `relatorio_${exam.exam_type}_${exam.exam_date}.csv`;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

                let csvContent = 'Parâmetro,Valor,Unidade,Ref Mín,Ref Máx,Status\n';
                values.forEach(val => {
                    csvContent += `"${val.parameter_name}","${val.value}","${val.unit || ''}","${val.reference_min}","${val.reference_max}","${val.is_normal ? 'Normal' : 'Alterado'}"\n`;
                });

                res.send(csvContent);

            } else {
                // PDF (mesmo que downloadExamPDF mas como relatório)
                return ExamController.downloadExamPDF(req, res);
            }

            // Log de auditoria
            logAuditEvent(req, 'download_report', 'exam', examId, {
                examType: exam.exam_type,
                format
            });

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório'
            });
        }
    }

    // Upload de arquivo para exame
    static uploadExamFile(req, res) {
        const uploadSingle = upload.single('file');
        
        uploadSingle(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            try {
                const { examId } = req.params;
                const patientId = req.user.id;

                // Verificar se o exame pertence ao paciente
                const exams = await Database.query(
                    'SELECT * FROM exams WHERE id = ? AND patient_id = ?',
                    [examId, patientId]
                );

                if (exams.length === 0) {
                    // Remover arquivo se exame não encontrado
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(404).json({
                        success: false,
                        message: 'Exame não encontrado'
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nenhum arquivo foi enviado'
                    });
                }

                // Salvar informações do arquivo no banco
                await Database.query(`
                    INSERT INTO exam_files (exam_id, filename, original_name, file_path, file_size, mime_type, uploaded_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    examId,
                    req.file.filename,
                    req.file.originalname,
                    req.file.path,
                    req.file.size,
                    req.file.mimetype
                ]);

                // Log de auditoria
                logAuditEvent(req, 'upload_file', 'exam', examId, {
                    filename: req.file.originalname,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype
                });

                res.json({
                    success: true,
                    message: 'Arquivo enviado com sucesso',
                    data: {
                        filename: req.file.originalname,
                        size: req.file.size,
                        uploadedAt: new Date().toISOString()
                    }
                });

            } catch (error) {
                console.error('Erro ao fazer upload:', error);
                
                // Remover arquivo em caso de erro
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                res.status(500).json({
                    success: false,
                    message: 'Erro interno do servidor'
                });
            }
        });
    }
}

module.exports = ExamController;
const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

exports.sendEmail = async (to, subject, html, text = null) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"EcoWaste" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '')
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé à:', to);
        return result;
    } catch (error) {
        console.error('❌ Erreur envoi email à', to, ':', error.message);
        throw error;
    }
};

// Les fonctions sendWelcomeEmail et sendLoginNotificationEmail restent identiques
exports.sendWelcomeEmail = async (user) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
                .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌱 Bienvenue sur EcoWaste !</h1>
                    <p>Rejoignez la communauté pour un environnement plus propre</p>
                </div>
                <div class="content">
                    <h2>Bonjour ${user.firstName} ${user.lastName} !</h2>
                    <p>Nous sommes ravis de vous accueillir dans notre communauté dédiée à la protection de l'environnement.</p>
                    
                    <div class="feature">
                        <h3>🎯 Ce que vous pouvez faire dès maintenant :</h3>
                        <ul>
                            <li><strong>📱 Signaler des dépôts sauvages</strong> autour de vous</li>
                            <li><strong>🗑️ Participer à des événements de nettoyage</strong></li>
                            <li><strong>🏆 Gagner des points écologiques</strong> et monter en niveau</li>
                            <li><strong>📊 Suivre votre impact</strong> sur l'environnement</li>
                            <li><strong>👥 Collaborer</strong> avec d'autres écocitoyens</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Commencer maintenant</a>
                    </div>

                    <p><strong>Vos informations de compte :</strong></p>
                    <ul>
                        <li><strong>Email :</strong> ${user.email}</li>
                        <li><strong>Rôle :</strong> ${user.role === 'citizen' ? 'Éco-citoyen' : user.role}</li>
                        <li><strong>Points de départ :</strong> ${user.ecoPoints} points</li>
                    </ul>

                    <p>Merci de contribuer à rendre notre planète plus propre ! 🌍</p>
                </div>
                <div class="footer">
                    <p>© 2024 EcoWaste. Tous droits réservés.</p>
                    <p><a href="${process.env.FRONTEND_URL}/contact" style="color: #666;">Contactez-nous</a> | <a href="${process.env.FRONTEND_URL}/help" style="color: #666;">Aide</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await exports.sendEmail(user.email, '🌱 Bienvenue sur EcoWaste !', html);
};

exports.sendLoginNotificationEmail = async (user, loginInfo = {}) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 25px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2196F3; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔐 Connexion détectée</h2>
                </div>
                <div class="content">
                    <h3>Bonjour ${user.firstName} !</h3>
                    <p>Une connexion à votre compte EcoWaste vient d'être effectuée.</p>
                    
                    <div class="info-box">
                        <h4>📋 Détails de la connexion :</h4>
                        <ul>
                            <li><strong>👤 Utilisateur :</strong> ${user.firstName} ${user.lastName}</li>
                            <li><strong>📧 Email :</strong> ${user.email}</li>
                            <li><strong>🕐 Date :</strong> ${new Date().toLocaleString('fr-FR')}</li>
                            <li><strong>🏆 Points actuels :</strong> ${user.ecoPoints} points</li>
                            <li><strong>⭐ Niveau :</strong> ${user.level}</li>
                        </ul>
                    </div>

                    <div class="alert">
                        <h4>⚠️ Sécurité du compte</h4>
                        <p>Si vous n'êtes pas à l'origine de cette connexion, veuillez :</p>
                        <ol>
                            <li>Changer immédiatement votre mot de passe</li>
                            <li>Nous contacter via l'application</li>
                            <li>Vérifier vos dernières activités</li>
                        </ol>
                    </div>

                    <p>Merci de votre vigilance et de votre engagement écologique !</p>
                </div>
                <div class="footer">
                    <p>© 2024 EcoWaste. Protégeons notre environnement ensemble.</p>
                    <p><a href="${process.env.FRONTEND_URL}/security" style="color: #666;">Paramètres de sécurité</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await exports.sendEmail(user.email, '🔐 Connexion à votre compte EcoWaste', html);
};
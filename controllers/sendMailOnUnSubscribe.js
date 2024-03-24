const nodeMailer = require("nodemailer");
const dotenv = require('dotenv').config();
const { google } = require('googleapis')

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sendMailonSubscription = async (user) => {
    try {
        const accessToken = await oauth2Client.getAccessToken();

        let transporter = nodeMailer.createTransport({
            service: "gmail",
            auth: {
                type: 'OAuth2',
                user: process.env.USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        transporter.sendMail({
            from: `"TEAM ATZ" <${process.env.USER}>`,
            to: user,
            subject: "Unsubscribe Notification",
            
            html: `
            <body style="font-family: 'Ubuntu', sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #3631a9, #ff81c8);">

            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                
                <div style="margin-bottom: 40px;">
                    <div style="background-color: #f6e3f6; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="margin-top: 10px; font-size: 24px; color: #333;">OOOPS!! :( </h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #252424;"> You have unsubscribed to our channel. Sorry to say, you won't be able to get updates if you don't subscribe. </p>
                    </div>
                    <div style="background-color: #f6ebeb; border-radius: 5px; padding: 20px;">
                        <h2 style="margin-top: 10px; font-size: 24px; color: #333;">Share your opinions :)</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #252424;">Never hesitate to share your opinion with us...</p>
                    </div>
                </div>
                
                
            </div>
            
            </body>


            `
        }).then((info) => {
            console.log(`Message sent: ${info.messageId}`);
            
        }).catch(error=>console.error(error));
    } catch (error) {
        console.error("Error sending email:", error);
       
    }
};

module.exports = sendMailonSubscription;

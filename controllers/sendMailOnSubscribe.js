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
            subject: "Thanks for subscribing, what's next?",
            
            html: `
            <body style="font-family: 'Ubuntu', sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #3631a9, #ff81c8);">

            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0; background-color: transparent; border-radius: 5px;">
                    <h1 style="font-size: 50px; color: #d3cbcb;">Welcome to our channel ATZ!!</h1>
                    <p style="font-size: 25px; color: #e2d9d9;">Thanks for subscribing! From now on, you will get regular updates on our new features and also some of your activities..  <br>
                 </p>
                </div>
                <br>
                <div style="margin-bottom: 40px;">
                    <div style="background-color: #f6e3f6; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="margin-top: 10px; font-size: 24px; color: #333;">Our focus</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #252424;">We have limited our focus to the prediction system right now, a prediction system that predicts about Alzheimer's disease.</p>
                    </div>
                    <div style="background-color: #f6ebeb; border-radius: 5px; padding: 20px;">
                        <h2 style="margin-top: 10px; font-size: 24px; color: #333;">Additional Feature</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #252424;">We have developed a chatbot integrated into our prediction system. It assists users by providing suggestions and engaging in conversations related to Alzheimer's disease predictions.</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 24px; color: #f6ebeb;">Improvements and Feedback</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #e4d6d6;">We're committed to enhancing our prediction model continuously. Your feedback and reviews are valuable in this journey of improvement. Don't hesitate to share your thoughts and experiences with us. Together, let's make a difference in combating Alzheimer's disease. <strong>Have a nice day!! <br><center><strong style="font-size: 25px; color:white">:)</strong></center></strong></p>
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

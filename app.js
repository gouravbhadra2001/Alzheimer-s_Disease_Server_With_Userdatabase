const express = require('express');
const { MongoClient } = require('mongodb');
const sendMail = require('./controllers/sendMail');
const cors = require('cors');
const sendMailonSubscription = require('./controllers/sendMailOnSubscribe');
const sendMailonUnSubscription = require('./controllers/sendMailOnUnSubscribe')
const env = require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); 
const PORT = process.env.SERVER_PORT;


const uri = process.env.MONGO_CONNECT_URI;
const client = new MongoClient(uri);




// Routes
app.get("/", (req, res) => {
    res.send("This is the root page..");
});

app.post("/sendemail", sendMail);

// Insert data route
app.post("/insertData", async (req, res) => {
    try {
        await  client.connect();
        const { name, email, subscribed, reviews, predictions, starval} =  req.body;

        if (!name || !email) {
            return res.status(400).send("Name and email are required");
        }

        

        const db = client.db(process.env.DATABASE_NAME);
        const col = db.collection(process.env.COLLECTION_NAME);
        
        // Check if email already exists in the database
        const existingData = await col.findOne({ "email": email });
        if (existingData) {
            return res.status(400).send("Email already exists");
        }
        
        // If email doesn't exist, insert the data
        const document = {
            "name": name,
            "email": email,
            "subscribed": subscribed,
                            "reviews": reviews,
                            "predictions": predictions,
                            "starval": starval
        };

        await col.insertOne(document);
        
        res.send("Data inserted successfully");
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).send("Error inserting data");
    } finally {
        await client.close();
    }
});


app.post("/getSubscribedData", async (req, res) => {
    try {
        await client.connect();

        const db = client.db(process.env.DATABASE_NAME);
        const col = db.collection(process.env.COLLECTION_NAME);

        const { name, email } = req.body;
        const filter = {
            "name": name,
            "email": email
        };

        const data = await col.findOne(filter);

        if (data.subscribed===0){
            res.json(0);
        } else {
            res.json(1);
        }
    } catch (error) {
        console.error("Error reading data:", error);
        res.status(500).send("Error reading data");
    } finally {
        await client.close(); 
    }
});



app.post("/subscribe", async (req, res) => {
    try {
        await client.connect();

        const db = client.db(process.env.DATABASE_NAME);
        const col = db.collection(process.env.COLLECTION_NAME);
        const { name, email} = req.body;
        const filter = {
            "name": name,
            "email": email
        };

        await col.updateOne(
            filter,
            { $set: { "subscribed": 1 } },
            
        ).then(()=>{
            sendMailonSubscription(email)
        });

        res.status(200).send("Subscription status updated successfully.");
      
    } catch (error) {
        console.error("Error in subscribing:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close(); 
    }
});

    

app.post("/unsubscribe", async (req, res) => {
    try {
        await client.connect();

        const db = client.db(process.env.DATABASE_NAME);
        const col = db.collection(process.env.COLLECTION_NAME);
        const { name, email } = req.body;
        const filter = {
            "name": name,
            "email": email
        };

        const updateResult = await col.updateOne(
            filter,
            { $set: { "subscribed": 0 } }
        ).then(()=>{
            sendMailonUnSubscription(email)
        });

        if (updateResult.modifiedCount === 0) {
            return res.status(404).send("Account not found or already unsubscribed.");
        }

        res.status(200).send("Unsubscribed successfully.");
    } catch (error) {
        console.error("Error unsubscribing:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close(); 
    }
});


app.get("/*", (req, res) => {
    res.send("SORRY, :( , 404 NOT FOUND");
});

const start = async () => {
    try {
        await client.connect(); 
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`)
        });
    } catch (e) {
        console.error(`Failed to listen to the server app due to ${e}`);
    }
};

start();

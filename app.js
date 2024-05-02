const express = require('express');
const { MongoClient } = require('mongodb');
//const sendMail = require('./controllers/sendMail');
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



// Insert data route
app.post("/insertData", async (req, res) => {
    try {
        await  client.connect();
        const { name, email, subscribed, reviews, predictions, chatHistory, starval} =  req.body;

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
            "chatHistory":chatHistory,
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
    } 
});


app.post("/postReview", async (req, res) => {
    try {
      await client.connect();
      const db = client.db(process.env.DATABASE_NAME);
      const col = db.collection(process.env.COLLECTION_NAME);
      const { name, email, review } = req.body;
      const store_time = new Date().toISOString(); // capturing storing time
  
      const filter = {
        "name": name,
        "email": email
      };
  
      const result = await col.updateOne(filter, {
        $push: {
          "reviews": {
            "reviewText": review.reviewText,
            "submit_time": review.submit_time,
            "store_time": store_time
          }
        }
      });
  
      res.status(200).json({ message: "Prediction added successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
   
  });
  


app.post("/postPrediction",async (req, res)=>{
    try {
        await client.connect();
        const db = client.db(process.env.DATABASE_NAME);
        const col = db.collection(process.env.COLLECTION_NAME);
        const { name, email, prediction} = req.body;
        const store_time = new Date().toISOString(); // capturing storing time
    
        const filter = {
          "name": name,
          "email": email
        };
    
        const result = await col.updateOne(filter, {
          $push: {
            "predictions": {
                "uploadedImage": prediction.image,
              "predictionText": prediction.predictionText,
              "confidence":prediction.confidence,
              "predict_time": prediction.predict_time,
              "store_time": store_time
            }
          }
        }).then();
    
        res.status(200).json({ message: "Prediction added successfully"});
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
     
    });




    app.post("/postChats",async (req, res)=>{
        try {
            await client.connect();
            const db = client.db(process.env.DATABASE_NAME);
            const col = db.collection(process.env.COLLECTION_NAME);
            const { name, email, chatHistory } = req.body;
            const store_time = new Date().toISOString(); // capturing storing time
        
            const filter = {
              "name": name,
              "email": email
            };
        
            console.log(chatHistory)
            const result = await col.updateOne(filter, {
              $push: {
                "chatHistory": {
                    "userQuestion": chatHistory.userQuestion,
                  "botResponse": chatHistory.botResponse,
                  "response_time": chatHistory.response_time,
                  "store_time": store_time
                }
              }
            }).then();
        
            res.status(200).json({ message: "Chat added successfully"});
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
          }
         
        });    


        app.post("/predictionHistory", async (req, res) => {
          try {
            await client.connect();
            const db = client.db(process.env.DATABASE_NAME);
            const col = db.collection(process.env.COLLECTION_NAME);
            const { name, email } = req.body;
            const filter = { "name": name, "email": email };
        
            // Use findOne() to find a single document
            const doc = await col.findOne(filter);
        
            if (!doc) {
              // If no document found, return empty array or handle as needed
              res.json([]);
              return;
            }
        
            // Extract predictions array from the found document
            const predictionHistory = doc.predictions || [];
        
            res.json(predictionHistory);
          } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
          }
        });
        

        app.post("/chatHistory", async (req, res) => {
          try {
            await client.connect();
            const db = client.db(process.env.DATABASE_NAME);
            const col = db.collection(process.env.COLLECTION_NAME);
            const { name, email } = req.body;
            const filter = { "name": name, "email": email };
        
            // Use findOne() to find a single document
            const doc = await col.findOne(filter);
        
            if (!doc) {
              // If no document found, return empty array or handle as needed
              res.json([]);
              return;
            }
        
            // Extract predictions array from the found document
            const chatHistory = doc.chatHistory || [];
        
            res.json(chatHistory);
          } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
          }
        });
        
        app.post("/updateProfile", async (req, res) => {
          try {
              await client.connect();
              const db = client.db(process.env.DATABASE_NAME);
              const col = db.collection(process.env.COLLECTION_NAME);
              const { name, email, bio, location } = req.body;
              
              // Define the filter to find the user
              const filter = { "name": name, "email": email };
      
              // Use findOne to find a document matching the filter
              const foundDocument = await col.findOne(filter);
      
              if (foundDocument === null) {
                  // If document doesn't exist, insert it with the fields
                  await col.updateOne({ "name": name, "email": email, "bio": bio, "location": location });
                  res.send("Stored bio and location");
              } else {
                  // If document exists, update it with the new fields
                  await col.updateOne(filter, { $set: { "bio": bio, "location": location } });
                  res.send("Updated bio and location");
              }
          } catch (e) {
              // Handle errors
              console.error("Error finding/updating profile:", e);
              res.status(500).send("Internal Server Error");
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



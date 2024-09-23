import bcrypt from "bcryptjs";
import config from "config";
import cors from 'cors';
import express from "express";
import jwt from 'jsonwebtoken';
import { fetchData } from "./controllers/BatteryController.js";
import Battery from "./models/Battery.js";
import Battery10 from "./models/Battery10.js";
import Battery2 from "./models/Battery2.js";
import Battery3 from "./models/Battery3.js";
import Battery4 from "./models/Battery4.js";
import Battery5 from "./models/Battery5.js";
import Battery6 from "./models/Battery6.js";
import Battery7 from "./models/Battery7.js";
import Battery8 from "./models/Battery8.js";
import Battery9 from "./models/Battery9.js";


// "DB_URI": "mongodb+srv://nikhila:nikhila@cluster0.spwyiae.mongodb.net/"
// https://www.ketomotors.in
import { ENE, EXIDE, EXM, LG9, NEU, OTHERS, RED, TTK, WEC } from "./models/Historical.js";

import User from "./models/Users.js";
import "./utils/dbConnect.js";
// import TableController from "./controllers/TableController.js";
import path from "path";
import FrontlineApiBase from "twilio/lib/rest/FrontlineApiBase.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || config.get("PORT");
const JWT_SECRET = process.env.JWT_SECRET || 'ketoo';

// Middleware - Parse incoming requests as JSON
app.use(express.json());

const corsorigin = {
  origin: '*'
};

// Use cors middleware
app.use(cors(corsorigin));

app.use(express.static(path.join(__dirname, "build")));


// app.use(express.static(path.join(__dirname, "build")));

// app.use("/api", reportRouter)
// app.use("/api", TableController)

const devices = [5715131, 5640344, 5644154, 5691447, 5691471, 5691488, 5691496, 5691499, 5714764, 5709381];

const fetchDataForDevice = (deviceId) => {
  setInterval(() => {
    fetchData(deviceId)
      .then(() =>
        console.log(`Data fetched successfully for device ${deviceId}`)
      )
      .catch(error => console.error(`Failed to fetch data for device ${deviceId}:`, error));
  }, 10000);
};

devices.forEach(fetchDataForDevice);

app.get('/api/live-data', async (req, res) => {
  try {
    const { deviceId, batterySerialNumber, startTime, endTime } = req.query;

    // // Validate that all necessary parameters are provided
    // if (!packSerialNumber || !startTime || !endTime) {
    //   return res.status(400).send({ message: 'Missing required parameters: packSerialNumber, startTime, and endTime.' });
    // }

    const query = {
      packSerialNumber: batterySerialNumber,
      createdAt: {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      }
    };

    const model = getModelForDevice(deviceId);
    const results = await model.find(query).sort({ createdAt: -1 });

    // if (results.length === 0) {
    //   return res.status(404).send({ message: 'No records found within the specified time range.' });
    // }

    res.send(results);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    console.log("API Hit")
    const users = await User.find(); // Use Mongoose's find method to fetch all users
    res.json(users); // Respond with the fetched users
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const validRoles = ['ADMIN', 'EXM', 'TTK', 'NEU', 'OTHERS', 'EXIDE', 'WEC', 'LG9', 'ENE', 'RED'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

    // Create a new user and save to DB
    const user = new User({
      email,
      password: hashedPassword,
      role: role
    });

    await user.save(); // Save the user to the database

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {  // Handle duplicate key error
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

//Login
app.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("Login API");

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the submitted password with the one in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if the submitted role matches the user's role
    if (user.role !== role) {
      return res.status(401).json({ error: "Access denied, incorrect role" });
    }

    // Define a payload for the JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role  // Include role in the payload if needed elsewhere in your app
      },
    };

    // Generate a JWT token
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error generating token" });
      }
      // Send the token and the role back with the response
      res.json({
        message: "Login Successful",
        token: token,
        supplier: user.role  // Send the supplier (role) back with the response
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error" }); // More descriptive error message
  }
});

app.get('/pass/:make', async (req, res) => {
  try {
    const { make } = req.params;
    const model = modelsMap[make.toUpperCase()];
    const passRecords = await model.find({ Condition: "Strong" });
    res.json(passRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
})

app.get('/fail/:make', async (req, res) => {
  try {
    const { make } = req.params;
    const model = modelsMap[make.toUpperCase()];
    if (!model) {
      return res.status(400).json({ error: 'Invalid make provided' });
    }
    const failRecords = await model.find({ Condition: "Weak" });
    res.json(failRecords);

  } catch (error) {
    console.error(error);
    res.status(500).json({ er: error });
  }
})

// Example route with a parameter
app.get("/hello/:name", (req, res) => {
  const { name } = req.params;
  res.send(`Hello, ${name}!`);
});


app.get("/5715131", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000);  // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5640344", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTenEntries = await Battery2.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents

    res.json(latestTenEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5644154", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTenEntries = await Battery3.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents

    res.json(latestTenEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

});

app.get("/5691447", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery4.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5691471", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery5.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5691488", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery6.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000);  // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5691496", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery7.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000);  // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5691499", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery8.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents
    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5714764", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery9.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000);  // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/5709381", async (req, res) => {
  try {
    // Assuming your model is named BatteryData and you've enabled timestamps in your schema
    const latestTwoEntries = await Battery10.find()
      .sort({ createdAt: -1 }) // Sort in descending order to get the latest documents
      .limit(2000); // Limit to the latest two documents

    res.json(latestTwoEntries);

  } catch (error) {
    console.error("Failed to fetch battery data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const getModelForDevice = (deviceID) => {
  const modelsMap = {
    '5715131': Battery,
    '5640344': Battery2,
    '5644154': Battery3,
    '5691447': Battery4,
    '5691471': Battery5,
    '5691488': Battery6,
    '5691496': Battery7,
    '5691499': Battery8,
    '5714764': Battery9,
    '5709381': Battery10
  };

  const model = modelsMap[deviceID];
  if (!model) {
    console.error(`Unsupported device ID: ${deviceID}`);
    return null;  // Return null to handle this more gracefully
  }
  return model;
};

async function fetchLatestDocumentsByModel(Model, make) {
  const regex = new RegExp(make, 'i'); // Create a case-insensitive regex from the make parameter
  // Ensure the fields returned are only those necessary
  return await Model.aggregate([
    { $match: { 'bmsMake': regex } },
    { $sort: { 'packSerialNumber': 1, 'date': -1 } },
    {
      $group: {
        _id: '$packSerialNumber',
        doc: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$doc' }
    },
    {
      $project: { packSerialNumber: 1, date: 1, _id: 0, otherField: 1 } // Modify based on needed fields
    }
  ], { allowDiskUse: true });
}

// Define a helper function to get counts from a model
const getCountFromModel = async (make) => {
  try {
    return await make.countDocuments();
  } catch (error) {
    console.error(`Error getting count for make ${make}:`, error);
    throw error;
  }
};

app.get('/api/battery/counts', async (req, res) => {
  try {
    const counts = await Promise.all([
      getCountFromModel(EXIDE),
      getCountFromModel(EXM),
      getCountFromModel(LG9),
      getCountFromModel(NEU),
      getCountFromModel(OTHERS),
      getCountFromModel(TTK),
      getCountFromModel(WEC),
      getCountFromModel(ENE),
      getCountFromModel(RED)
    ]);

    // Map the counts to model names for a clearer response
    const response = {
      EXIDE: counts[0],
      EXM: counts[1],
      LG9: counts[2],
      NEU: counts[3],
      OTHERS: counts[4],
      TTK: counts[5],
      WEC: counts[6],
      ENE: counts[7],
      RED: counts[8]
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching unique battery serial number counts:", err);
    res.status(500).json({ error: "Failed to fetch unique battery serial number counts." });
  }
});

const getECountFromModel = async (make) => {
  try {
    return await make.countDocuments({ Condition: "Weak" });
  } catch (error) {
    console.error(`Error getting count for make ${make}:`, error);
    throw error;
  }
};


app.get('/api/battery/errorcounts', async (req, res) => {
  try {
    const counts = await Promise.all([
      getECountFromModel(EXIDE),
      getECountFromModel(EXM),
      getECountFromModel(LG9),
      getECountFromModel(NEU),
      getECountFromModel(RED),
      getECountFromModel(OTHERS),
      getECountFromModel(TTK),
      getECountFromModel(WEC),
      getECountFromModel(ENE)
    ]);

    // Map the counts to model names for a clearer response
    const response = {
      EXIDE: counts[0],
      EXM: counts[1],
      LG9: counts[2],
      NEU: counts[3],
      OTHERS: counts[4],
      TTK: counts[5],
      WEC: counts[6],
      ENE: counts[7],
      RED: counts[8]
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching battery error counts:", err);
    res.status(500).json({ error: "Failed to fetch battery error counts." });
  }
});

const getPCountFromModel = async (make) => {
  try {
    return await make.countDocuments({ Condition: "Strong" });
  } catch (error) {
    console.error(`Error getting count for make ${make}:`, error);
    throw error;
  }
};


app.get('/api/battery/strongcounts', async (req, res) => {
  try {
    const counts = await Promise.all([
      getPCountFromModel(EXIDE),
      getPCountFromModel(EXM),
      getPCountFromModel(LG9),
      getPCountFromModel(NEU),
      getPCountFromModel(RED),
      getPCountFromModel(OTHERS),
      getPCountFromModel(TTK),
      getPCountFromModel(WEC),
      getPCountFromModel(ENE)
    ]);

    // Map the counts to model names for a clearer response
    const response = {
      EXIDE: counts[0],
      EXM: counts[1],
      LG9: counts[2],
      NEU: counts[3],
      OTHERS: counts[4],
      TTK: counts[5],
      WEC: counts[6],
      ENE: counts[7],
      RED: counts[8]
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching battery error counts:", err);
    res.status(500).json({ error: "Failed to fetch battery error counts." });
  }
});

app.get('/api/battery/total/:make', async (req, res) => {
  const make = req.params.make;
  try {
    // Use Promise.all to run queries in parallel
    const results = await Promise.all([
      fetchLatestDocumentsByModel(Battery, make),
      fetchLatestDocumentsByModel(Battery2, make),
      fetchLatestDocumentsByModel(Battery3, make),
      fetchLatestDocumentsByModel(Battery4, make),
      fetchLatestDocumentsByModel(Battery5, make),
      fetchLatestDocumentsByModel(Battery6, make),
      fetchLatestDocumentsByModel(Battery7, make),
      fetchLatestDocumentsByModel(Battery8, make),
      fetchLatestDocumentsByModel(Battery9, make),
      fetchLatestDocumentsByModel(Battery10, make)
    ]);
    // Flatten the array and deduplicate
    const combinedResults = results.flat();
    const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.packSerialNumber, item])).values());

    res.json(uniqueResults);
  } catch (err) {
    console.error("Error fetching latest battery data with make:", make, err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/battery/:packSerialNumber', async (req, res) => {
  try {
    const { packSerialNumber } = req.params;
    // Fetch documents from all three collections
    const results = await Promise.all([
      Battery.find({ packSerialNumber: packSerialNumber }),
      Battery2.find({ packSerialNumber: packSerialNumber }),
      Battery3.find({ packSerialNumber: packSerialNumber }),
      Battery4.find({ packSerialNumber: packSerialNumber }),
      Battery5.find({ packSerialNumber: packSerialNumber }),
      Battery6.find({ packSerialNumber: packSerialNumber }),
      Battery7.find({ packSerialNumber: packSerialNumber }),
      Battery8.find({ packSerialNumber: packSerialNumber }),
      Battery9.find({ packSerialNumber: packSerialNumber }),
      Battery10.find({ packSerialNumber: packSerialNumber })
    ]);
    // Combine results from all three collections into one array
    const combinedResults = results.flat(); // This flattens the array of arrays into a single array
    res.status(200).json(combinedResults);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
});

// app.get('/undercdc/:make', async (req, res) => {
//   const make = req.params.make;
//   const models = [Battery, Battery2, Battery3, Battery4, Battery5, Battery6, Battery7, Battery8, Battery9, Battery10];

//   try {
//     // Fetch the latest record from each model where bmsMake matches and connect is true
//     const promises = models.map(model => model.findOne({ bmsMake: make, connect: true }).sort({ createdAt: -1 }));
//     const results = await Promise.all(promises);

//     // Count how many records meet the criteria
//     const count = results.reduce((acc, current) => acc + (current ? 1 : 0), 0);

//     res.json({
//       make: make,
//       count: count
//     });
//   } catch (error) {
//     console.error('Failed to fetch data:', error);
//     res.status(500).send({ message: 'Error fetching data' });
//   }
// });

const getCountFromUModel = async (make) => {
  try {
    const currentTime = new Date();
    const twentyMinutesAgo = new Date(currentTime.getTime() - 20 * 60 * 1000);
    console.log("Current Time: " + currentTime);
    console.log("20 Minutes Ago: " + twentyMinutesAgo);

    return await make.countDocuments({
      isActive: true,
      endTime: {
        $gte: twentyMinutesAgo,
        $lte: currentTime
      }
    });
  } catch (error) {
    console.error(`Error getting count for make ${make}:`, error);
    throw error;
  }
};

app.get('/undercdc/count', async (req, res) => {
  try {
    const counts = await Promise.all([
      getCountFromUModel(EXIDE),
      getCountFromUModel(EXM),
      getCountFromUModel(LG9),
      getCountFromUModel(NEU),
      getCountFromUModel(OTHERS),
      getCountFromUModel(TTK),
      getCountFromUModel(WEC),
      getCountFromUModel(ENE),
      getCountFromUModel(RED)
    ]);

    // Map the counts to model names for a clearer response
    const response = {
      EXIDE: counts[0],
      EXM: counts[1],
      LG9: counts[2],
      NEU: counts[3],
      OTHERS: counts[4],
      TTK: counts[5],
      WEC: counts[6],
      ENE: counts[7],
      RED: counts[8]
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching unique battery serial number counts:", err);
    res.status(500).json({ error: "Failed to fetch unique battery serial number counts." });
  }

})

const modelsMap = {
  EXM: EXM,
  NEU: NEU,
  OTHERS: OTHERS,
  TTK: TTK,
  EXIDE: EXIDE,
  WEC: WEC,
  EXIDE: EXIDE,
  LG9: LG9,
  ENE: ENE,
  RED: RED
};

app.get('/api/historical/:make/:page', async (req, res) => {
  try {
    const { make } = req.params;
    const page = parseInt(req.params.page, 10) || 1; // Default to page 1 if no page is specified
    const limit = 50;
    const skip = (page - 1) * limit; // Calculate the number of documents to skip
    const model = modelsMap[make.toUpperCase()];

    if (!model) {
      return res.status(404).send({ message: 'Make not found' });
    }

    // Fetch the total number of documents to provide pagination information
    const totalCount = await model.countDocuments();

    // Use find() with limit and skip for pagination
    const results = await model.find().skip(skip).limit(limit);

    // Building the response with pagination details
    res.send({
      status: "success",
      data: results,
      page: page,
      length: results.length,
      totalPages: Math.ceil(totalCount / limit),
      totalCount: totalCount
    });
    console.log("Make API Hit, Page:", page);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

app.get('/api/latestdevice/:bmsMake', async (req, res) => {
  const bmsMake = req.params.bmsMake;
  const models = [Battery, Battery2, Battery3, Battery4, Battery5, Battery6, Battery7, Battery8, Battery9, Battery10];

  try {
    // Define the aggregation pipeline
    const aggregationPipeline = [
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$ident', // Group by ident to get the latest record per device
          latestRecord: { $first: '$$ROOT' } // Get the first record after sorting by date
        }
      }
    ];

    // Run the aggregation query on each model and collect all promises
    const allPromises = models.map(model => model.aggregate(aggregationPipeline, { allowDiskUse: true }));

    // Wait for all promises to resolve
    const allResults = await Promise.all(allPromises);

    // Combine all results into a single array
    const combinedResults = allResults.flat();

    // Determine the response based on the bmsMake value
    let devices;
    if (bmsMake === 'ADMIN') {
      // If ADMIN, return all devices without filtering by bmsMake
      devices = combinedResults.map(device => ({
        ident: device.latestRecord.ident,
        connect: device.latestRecord.connect
      }));
    } else {
      // Otherwise, filter the devices by the specified bmsMake
      const filteredResults = combinedResults.filter(device => device.latestRecord.bmsMake === bmsMake);
      devices = filteredResults.map(device => ({
        ident: device.latestRecord.ident,
        connect: device.latestRecord.connect
      }));
    }

    if (devices.length === 0) {
      return res.status(404).json({ message: "No devices found for the specified BMS make." });
    }

    res.json(devices); // Send the appropriate devices as response
  } catch (err) {
    console.error("Error fetching device IDs from latest records:", err);
    res.status(500).json({ error: "Failed to fetch device IDs." });
  }
});



// app.post('/add-device', async (req, res) => {
//   const Device = req.params.device;
//   const 
// })

// app.get('/notifications/:packSerialNumber', async (req, res) => {
//   try {
//     const { packSerialNumber } = req.params;
//     const notifications = await Notification.find({ packSerialNumber }).sort({ createdAt: -1 }).limit(2);

//     if (notifications.length > 0) {
//       res.json(notifications);
//     } else {
//       res.status(404).send('No notifications found for the specified packSerialNumber.');
//     }
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });


app.post("/greet", (req, res) => {
  const { name } = req.body;
  if (name) {
    res.json({ message: `Hello, ${name}!` });
  } else {
    res
      .status(400)
      .json({ error: "Name parameter is missing in the request body." });
  }
});

app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT 🚀 ${PORT}`);
});
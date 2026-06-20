require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser'); // <-- REMOVED
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// !! IMPORTANT !!
// Replace with your own MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://nitiniare:nitiniare@cluster0.jpuub1j.mongodb.net/';
// Replace with your own secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || '123456';

// --- MIDDLEWARE ---
app.use(express.json()); // <-- ADDED: The modern way to parse JSON bodies
app.use(express.static(__dirname)); // <-- ADDED: Serve static files from the root directory

// --- GEMINI CONFIG ---
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');


// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- DATABASE SCHEMAS ---

// User Schema (for login/signup)
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Diet Plan Schema
const DietPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    age: { type: Number, required: true },
    weight: { type: Number, required: true },
    glucose: { type: Number, required: true },
    activity: { type: Number, required: true },
    calories: { type: Number, required: true },
    mealList: { type: Array, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Insulin Dose Schema
const InsulinDoseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    curBG: { type: Number, required: true },
    carbs: { type: Number, required: true },
    targetBG: { type: Number, required: true },
    isf: { type: Number, required: true },
    icr: { type: Number, required: true },
    totalDose: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Contact Message Schema
const ContactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Optional: if user is logged in
    createdAt: { type: Date, default: Date.now }
});

// --- MODELS ---
const User = mongoose.model('User', UserSchema);
const DietPlan = mongoose.model('DietPlan', DietPlanSchema);
const InsulinDose = mongoose.model('InsulinDose', InsulinDoseSchema);
const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);

// --- AUTH MIDDLEWARE ---
// This function checks for a valid token on protected routes
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // req.user = decoded; // <-- OLD (Buggy)
        req.user = decoded.user; // <-- FIXED: Store the inner user object
        next(); // Proceed to the protected route
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// --- API ROUTES ---

// [POST] /api/auth/signup - Create a new user
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        user = new User({ email, password });
        await user.save();

        res.status(201).json({ message: 'User created successfully.' });

    } catch (err) {
        // This catch block will now trigger if req.body was undefined
        console.error('Signup Error:', err); // Added console.error for debugging
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// [POST] /api/auth/login - Log in a user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = (password === user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Create and sign a token
        const payload = { user: { id: user.id, email: user.email } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({ token, email: user.email });

    } catch (err) {
        console.error('Login Error:', err); // Added console.error for debugging
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// [POST] /api/contact - Save a contact message
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message, token } = req.body;

        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.user.id; // This was already correct
            } catch (e) {
                // Ignore if token is invalid, just save message anonymously
            }
        }

        const newMessage = new ContactMessage({ name, email, message, userId });
        await newMessage.save();

        res.status(201).json({ message: 'Message saved successfully.' });
    } catch (err) {
        console.error('Contact Error:', err); // Added console.error for debugging
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// --- PROTECTED ROUTES (Require Auth) ---

// [POST] /api/diet/save - Save a diet plan
app.post('/api/diet/save', authMiddleware, async (req, res) => {
    try {
        const { age, weight, glucose, activity, calories, mealList } = req.body;
        const userId = req.user.id; // Get user ID from auth middleware (now fixed)

        const newPlan = new DietPlan({
            userId,
            age,
            weight,
            glucose,
            activity,
            calories,
            mealList
        });

        await newPlan.save();
        res.status(201).json({ message: 'Diet plan saved.', plan: newPlan });

    } catch (err) {
        console.error('Diet Save Error:', err); // Added console.error for debugging
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// [GET] /api/diet/history - Get all diet plans for logged-in user
app.get('/api/diet/history', authMiddleware, async (req, res) => {
    try {
        const plans = await DietPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// [POST] /api/insulin/save - Save an insulin dose calculation
app.post('/api/insulin/save', authMiddleware, async (req, res) => {
    try {
        const { curBG, carbs, targetBG, isf, icr, totalDose } = req.body;
        const userId = req.user.id; // Get user ID from auth middleware (now fixed)

        const newDose = new InsulinDose({
            userId,
            curBG,
            carbs,
            targetBG,
            isf,
            icr,
            totalDose
        });

        await newDose.save();
        res.status(201).json({ message: 'Insulin dose saved.', dose: newDose });

    } catch (err) {
        console.error('Insulin Save Error:', err); // Added console.error for debugging
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// [GET] /api/insulin/history - Get all insulin calcs for logged-in user
app.get('/api/insulin/history', authMiddleware, async (req, res) => {
    try {
        const doses = await InsulinDose.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(doses);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// [POST] /api/suggest-food - Get AI food suggestions
app.post('/api/suggest-food', authMiddleware, async (req, res) => {
    try {
        const { glucose, weight, activity } = req.body;

        // Construct prompt
        const prompt = `
            Act as an expert dietician for a diabetic patient.
            User Profile:
            - Current Glucose Level: ${glucose} mg/dL
            - Weight: ${weight} kg
            - Activity Level (1.2 sedentary - 1.9 active): ${activity}
            
            Task: Suggest 3 specific, healthy food options or meals for this user right now considering their glucose level. 
            If glucose is low (<70), suggest fast-acting carbs.
            If glucose is high (>180), suggest low-carb, high-fiber options.
            If normal, suggest a balanced meal.
            
            Format:
            1. [Option Name]: [Brief reason]
            2. [Option Name]: [Brief reason]
            3. [Option Name]: [Brief reason]
            
            Keep it concise.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ suggestion: text });

    } catch (err) {
        console.error('AI Suggestion Error:', err);
        res.status(500).json({ message: 'Failed to generate suggestion.', error: err.message });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


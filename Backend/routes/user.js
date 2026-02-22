const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { User } = require("../db");
const router = express.Router();
require('dotenv').config();

const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string()
})

router.post("/signup", async (req, res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(req.body);
    if(!success) {
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const user = User.findOne({
        username: body.username
    })

    if(user._id) {
        return res.json({
            message: "User already exists"
        })
    }

    const dbUser = await User.create(body);

    const token = jwt.sign({
        userId: dbUser._id
    }, process.env.JWT_SECRET);

    res.json({
        message: "User created successfully",
        token
    });
});

const signinSchema = zod.object({
    username: zod.string(),
    password: zod.string()
});

router.post("/signin", async (req, res) => {
    const success = signinSchema.safeParse(req.body);

    if(!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if(user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        res.json({
            token
        })
        return;
    }

    res.status(411).json({
        message: "Error while logging in"
    })
})

module.exports = router;
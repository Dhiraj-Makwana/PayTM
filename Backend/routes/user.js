const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("../middleware");
const { User, Account } = require("../db");
const router = express.Router();
require('dotenv').config();

//SIGN-UP Route with ZOD input validation
const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string()
})

router.post("/signup", async (req, res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(req.body); // {success} Because this returns an object
    //const obj = signupSchema.safeParse(req.body);
    //if(!obj.success) {}
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

    //----- CREATE new Account -----
    await Account.create({
        userId: dbUser._id,
        balance: 1 + Math.random() * 10000
    });
    //-----  -----

    const token = jwt.sign({
        userId: dbUser._id
    }, process.env.JWT_SECRET);

    res.json({
        message: "User created successfully",
        token
    });
});

//SIGN-IN Route with ZOD input validation
const signinSchema = zod.object({
    username: zod.string(),
    password: zod.string()
});

router.post("/signin", async (req, res) => {
    const {success} = signinSchema.safeParse(req.body);

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
        }, process.env.JWT_SECRET);

        res.json({
            token
        })
        return;
    }

    res.status(411).json({
        message: "Error while logging in"
    })
})

//Update (password, firstName, lastName) Route with zod input validation
const updateSchema = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})

router.put("/", authMiddleware, async (req, res) => {
    const {success} = updateSchema.safeParse(req.body)
    if(!success){
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne({_id: req.userId}, req.body);

    res.json({
        message: "Updated successfully"
    });
})

//Search user from db based on query input
router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require("mongoose")
const User = require('./models/User')
const Post = require('./models/Post')
const bcrypt = require('bcryptjs')
const app = express();
const jwt = require('jsonwebtoken');
const cookiePasrser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
require('dotenv').config();


const salt = bcrypt.genSaltSync(10);
const secret = "hiqhwiqwoqkwpq"

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
//app.use(cors({ credentials: true, origin: 'https://cradle0ffilth.github.io' }));
app.use(express.json());
app.use(cookiePasrser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const url = 'mongodb+srv://blog:c98E7qKCzUgZ1Gmj@cluster0.ctuzl5r.mongodb.net/?retryWrites=true&w=majority';

async function connect() {
    try {
        await mongoose.connect(url);
        console.log("connected to db")
    } catch (err) {
        console.log("error connecting to db")
        console.log(err)
    }
}
connect();

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt)
        });
        res.json(userDoc);

    } catch (err) {
        res.status(400).json(err);
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });
    bcrypt.compare(password, userDoc.password, (err, result) => {
        if (result) {
            jwt.sign({ username, id: userDoc }, secret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json({
                    id: userDoc._id,
                    username: userDoc.username
                });
            })
        } else {
            res.status(400).json('wrong credentials');
        }
    });
})

app.get('/profile', async (req, res) => {
    if(req.cookies){}
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        //if (err) throw err;
        res.json(info);
    })
})
app.post('/logout', (req, res) => {
    //res.status(200).json('ok');
    res.cookie('token', '').json('ok');
})

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    //add file name
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath)

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        res.json(postDoc);
    })

})

app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
});


app.listen(4000);
//V4kpGX3HoarCBkre

// mongodb+srv://blog:c98E7qKCzUgZ1Gmj@cluster0.ctuzl5r.mongodb.net/?retryWrites=true&w=majority

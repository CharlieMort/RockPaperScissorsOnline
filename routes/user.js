const router = require("express").Router();
let User = require("../models/user.model");

router.route("/leaderboard").get((req, res) => {
    User.find().sort({"score": -1}).select("username score").limit(5)
        .then(users => res.json(users))
        .catch(err => rs.status(400).json(`Error: ${err}`));
});

router.route("/").get((req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json(`Error: ${err}`));
});

router.route("/add").post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const score = 0;

    const newUser = new User({username, password, score});

    newUser.save()
        .then(() => res.json("User Added!"))
        .catch(err => res.status(400).json(`Error: ${err}`));
});

router.route("/login").post((req, res) => {
    User.findOne({username: {$regex: ".*" + req.body.username + ".*"}, password: req.body.password})
        .then(user => res.json(user))
        .catch(err => res.status(400).json(`Error: ${err}`));
})

router.route("/update/:id").post((req, res) => {
    User.findById(req.params.id)
        .then(user => {
            user.username = req.body.username;
            user.password = req.body.password;

            user.save()
                .then(() => res.json("User Updated!"))
                .catch(err => res.status(400).json(`Error: ${err}`));
        })
        .catch(err => res.status(400).json(`Error: ${err}`));
});

router.route("/addscore/:id").post((req, res) => {
    User.findById(req.params.id)
        .then(user => {
            user.score = parseInt(user.score) + 1;

            user.save()
                .then(() => res.json(`Score Updated To ${user.score}`))
                .catch(err => res.status(400).json(`Error: ${err}`));
        })
        .catch(err => res.status(400).json(`Error: ${err}`));
});

router.route("/get/:id").get((req, res) => {
    console.log(req.params.id);
    User.findById(req.params.id)
        .then(user => res.json(user))
        .catch(err => res.status(400).json(`Error: ${err}`));
});


module.exports = router;
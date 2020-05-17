const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "todo does have to be given !"],
  },
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to our brand new to do list!",
});

const item2 = new Item({
  name: "Please + button to add new item.",
});

let initialItems = [item1, item2];

app.get("/", function (req, response) {
  Item.find(function (err, res) {
    if (res.length === 0) {
      Item.insertMany(initialItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfuly added");
        }
      });
      response.redirect("/");
    } else {
      response.render("list", { pageName: "Today", items: res });
    }
  });
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, ourList) {
    if (!err) {
      if (!ourList) {
        const list = new List({
          name: customListName,
          items: initialItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { pageName: ourList.name, items: ourList.items });
      }
    }
  });
});

app.post("/", function (req, res) {
  const pageName = req.body.list;
  const content = req.body.task;
  const newTask = new Item({
    name: content,
  });

  if (pageName === "Today") {
    newTask.save();
    res.redirect("/");
  } else {
    List.findOne({ name: pageName }, function (err, foundItem) {
      foundItem.items.push(newTask);
      foundItem.save();
      res.redirect("/" + pageName);
    });
  }
});

app.post("/delete", function (req, res) {
  const id = req.body.checkbox;
  const pageName = req.body.pageName;

  if (pageName === "Today") {
    Item.findByIdAndDelete({ _id: id }, function (err) {
      if (!err) {
        console.log("Succesfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    console.log("else te");

    List.findOneAndUpdate(
      { name: pageName },
      { $pull: { items: { _id: id } } },
      function (err, foundOne) {
        if (!err) {
          console.log(foundOne);
          res.redirect("/" + pageName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server is running!");
});

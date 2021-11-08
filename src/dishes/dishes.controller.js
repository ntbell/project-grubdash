const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


//Checks {dishes} for a matching ID.  Assigns found dish to response.locals
function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    })
}

//Verifies that IDs in request.params and body are matching
function idsMatch(req, res, next) {
    const dishId = req.params.dishId;
    const { data: { id } = {} } = req.body;

    if (id && dishId !== id) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
        });
    }
    return next();
}

//Validates the properties of request.body
function isPropertyMissing(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    let message;
    if (!name || name === "") {
        message = "Dish must include a name";
    } else if (!description || description === "") {
        message = "Dish must include a description";
    } else if (!price || price === "") {
        message = "Dish must include a price";
    } else if (!Number.isInteger(price) || price <= 0) {
        message = "Dish must have a price that is an integer greater than 0";
    } else if (!image_url || image_url === "") {
        message = "Dish must include a image_url";
    }
    if (message) {
        next({
            status: 400,
            message: message,
        });
    }
    return next();
}

function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    res.locals.dish = {
        id: res.locals.dish.id,
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    };
    res.json({ data: res.locals.dish });
}

//Delete not supported by /dishes
module.exports = {
    create: [isPropertyMissing, create],
    read: [dishExists, read],
    update: [dishExists, isPropertyMissing, idsMatch, update],
    list,
}
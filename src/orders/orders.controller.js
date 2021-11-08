const path = require("path");
const { PerformanceNodeTiming } = require("perf_hooks");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


//Checks {orders} for a matching ID.  Assigns found order to response.locals
function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}`,
    })
}

//Verifies that IDs in request.params and body are matching and that the status is valid
function validateOrder(req, res, next) {
    const orderId = req.params.orderId;
    const { data: { id, status } = {} } = req.body;
    let message;

    if (id && id !== orderId) {
        message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`;
    } else if (!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
        message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
    } else if (status === "delivered") {
        message = "A delivered order cannot be changed";
    }
    if (message) {
        next({ status: 400, message: message });
    }
    return next();
}

//Destroy is only allowed when the order is pending
function validateDestroy(req, res, next) {
    if (res.locals.order.status !== "pending") {
        next({ status: 400, message: "An order cannot be deleted unless it is pending" });
    }
    return next();
}

//Validates the properties of request.body
function isPropertyMissing(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    let message;

    if (!deliverTo || deliverTo === "") {
        message = "Order must include a deliverTo";
    } else if (!mobileNumber || mobileNumber === "") {
        message = "Order must include a mobileNumber";
    } else if (!dishes) {
        message = "Order must include a dish";
    } else if (!Array.isArray(dishes) || dishes.length === 0) {
        message = "Order must include at least one dish";
    } else {
        for (let i = 0; i < dishes.length; i++) {
            const quantity = dishes[i].quantity;
            if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) message = `Dish ${i} must have a quantity that is an integer greater than 0`;
        }
    }
    if (message) {
        next({ status: 400, message: message });
    }
    return next();
}

function list(req, res) {
    res.json({ data: orders });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status ? status : "pending",
        dishes: dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function update(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    res.locals.order = {
        id: res.locals.order.id,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes,
    }
    res.json({ data: res.locals.order });
}

function destroy(req, res) {
    const index = orders.indexOf(res.locals.order);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [isPropertyMissing, create],
    read: [orderExists, read],
    update: [orderExists, isPropertyMissing, validateOrder, update],
    delete: [orderExists, validateDestroy, destroy],
    list,
}
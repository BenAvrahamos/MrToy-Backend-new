import {dbService} from '../../services/db.service.js'
import {logger} from '../../services/logger.service.js'
import {utilService} from '../../services/util.service.js'
import mongodb from 'mongodb'
const {ObjectId} = mongodb

const PAGE_SIZE = 3


async function query(filterBy={txt:''}) {
    try {
        const criteria = {
            vendor: { $regex: filterBy.txt, $options: 'i' }
        }
        const collection = await dbService.getCollection('car')
        var carCursor = await collection.find(criteria)

        if (filterBy.pageIdx !== undefined) {
            carCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)     
        }

        const cars = carCursor.toArray()
        return cars
    } catch (err) {
        logger.error('cannot find cars', err)
        throw err
    }
}

async function getById(carId) {
    try {
        const collection = await dbService.getCollection('car')
        const car =  await collection.findOne({ _id: ObjectId(carId) })
        car.createdAt = ObjectId(car._id).getTimestamp()

        return car
    } catch (err) {
        logger.error(`while finding car ${carId}`, err)
        throw err
    }
}

async function remove(carId) {
    try {
        const collection = await dbService.getCollection('car')
        await collection.deleteOne({ _id: ObjectId(carId) })
        return carId
    } catch (err) {
        logger.error(`cannot remove car ${carId}`, err)
        throw err
    }
}

async function add(car) {
    try {
        const collection = await dbService.getCollection('car')
        await collection.insertOne(car)
        return car
    } catch (err) {
        logger.error('cannot insert car', err)
        throw err
    }
}

async function update(car) {
    try {
        const carToSave = {
            vendor: car.vendor,
            price: car.price
        }
        const collection = await dbService.getCollection('car')
        await collection.updateOne({ _id: ObjectId(car._id) }, { $set: carToSave })
        return car
    } catch (err) {
        logger.error(`cannot update car ${carId}`, err)
        throw err
    }
}

async function addCarMsg(carId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('car')
        await collection.updateOne({ _id: ObjectId(carId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add car msg ${carId}`, err)
        throw err
    }
}

async function removeCarMsg(carId, msgId) {
    try {
        const collection = await dbService.getCollection('car')
        await collection.updateOne({ _id: ObjectId(carId) }, { $pull: { msgs: {id: msgId} } })
        return msgId
    } catch (err) {
        logger.error(`cannot add car msg ${carId}`, err)
        throw err
    }
}

export const carService = {
    remove,
    query,
    getById,
    add,
    update,
    addCarMsg,
    removeCarMsg
}

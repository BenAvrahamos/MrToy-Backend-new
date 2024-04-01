import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

async function query(filterBy) {

    try {
        const criteria = {}

        if (filterBy.name) {
            criteria.name = { $regex: filterBy.name, $options: 'i' }
        }

        if (filterBy.minPrice && !filterBy.maxPrice) {
            criteria.price = { $gt: +filterBy.minPrice }
        } else if (!filterBy.minPrice && filterBy.maxPrice) {
            criteria.price = { $lte: +filterBy.maxPrice }
        } else if (filterBy.minPrice && filterBy.maxPrice) {
            criteria.price = {
                $gt: +filterBy.minPrice,
                $lte: +filterBy.maxPrice
            }
        }

        if (filterBy.inStock !== '') {
            if (filterBy.inStock === 'false') {
                criteria.inStock = false
            } else {
                criteria.inStock = Boolean(filterBy.inStock);
            }
        }

        if (filterBy.labels && filterBy.labels.length > 0) {
            criteria.labels = { "$in": JSON.parse(filterBy.labels)}
        }

        const collection = await dbService.getCollection('toy')
        var toys = await collection.find(criteria).toArray()
        return toys
    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
    
        var toy = collection.findOne({ _id: ObjectId(toyId) })
        return toy
    } catch (err) {
        logger.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: ObjectId(toyId) })
    } catch (err) {
        logger.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    
    try {
        const toyToSave = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels
    
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        logger.error(`cannot update toy ${toy._id}`, err)
        throw err
    }
}

// async function addToyMsg(toyId, msg) {
//     try {
//         msg.id = utilService.makeId()
//         const collection = await dbService.getCollection('toy')
//         await collection.updateOne({ _id: ObjectId(toyId) }, { $push: { msgs: msg } })
//         return msg
//     } catch (err) {
//         logger.error(`cannot add toy msg ${toyId}`, err)
//         throw err
//     }
// }

// async function removeToyMsg(toyId, msgId) {
//     try {
//         const collection = await dbService.getCollection('toy')
//         await collection.updateOne({ _id: ObjectId(toyId) }, { $pull: { msgs: { id: msgId } } })
//         return msgId
//     } catch (err) {
//         logger.error(`cannot add toy msg ${toyId}`, err)
//         throw err
//     }
// }

export const toyService = {
    remove,
    query,
    getById,
    add,
    update,
    // addToyMsg,
    // removeToyMsg
}

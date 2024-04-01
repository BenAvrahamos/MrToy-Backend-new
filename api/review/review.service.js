import {dbService} from '../../services/db.service.js'
import {logger} from '../../services/logger.service.js'
import {asyncLocalStorage} from '../../services/als.service.js'
import mongodb from 'mongodb'
const {ObjectId} = mongodb

async function query(filterBy = {

}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('review')

        // const reviews = await collection.find(criteria).toArray()
        var reviews = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    localField: 'userId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser'
                }
            },
            {
                $unwind: '$byUser'
            },
            {
                $lookup:
                {
                    localField: 'toyId',
                    from: 'toy',
                    foreignField: '_id',
                    as: 'toy'
                }
            },
            {
                $unwind: '$toy'
            }
        ]).toArray()
        console.log('before map', reviews);
        reviews = reviews.map(review => {
            review.byUser = { _id: review.byUser._id, nickname: review.byUser.fullname }
            review.toy = { _id: review.toy._id,name :review.toy.name, price: review.toy.price }
            delete review.userId
            delete review.toyId
            return review
        })
        console.log('after map', reviews);
        return reviews
    } catch (err) {
        console.log('caught error', err);
        logger.error('cannot find reviews', err)
        throw err
    }

}

async function remove(reviewId) {
    try {
        const store = asyncLocalStorage.getStore()
        const { loggedinUser } = store
        const collection = await dbService.getCollection('review')
        // remove only if user is owner/admin
        const criteria = { _id: ObjectId(reviewId) }
        if (!loggedinUser.isAdmin) criteria.byUserId = ObjectId(loggedinUser._id)
        const {deletedCount} = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove review ${reviewId}`, err)
        throw err
    }
}


async function add(review) {
    try {
        const reviewToAdd = {
            byUserId: ObjectId(review.byUserId),
            aboutUserId: ObjectId(review.aboutUserId),
            txt: review.txt
        }
        const collection = await dbService.getCollection('review')
        await collection.insertOne(reviewToAdd)
        return reviewToAdd
    } catch (err) {
        logger.error('cannot insert review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.byUserId) criteria.byUserId = ObjectId(filterBy.byUserId)
    return criteria
}

export const reviewService = {
    query,
    remove,
    add
}



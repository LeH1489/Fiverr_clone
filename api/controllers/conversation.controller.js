import createError from "../utils/createError.js";
import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res, next) => {
  const newConversation = new Conversation({
    //nếu là seller thì trường id của model Conversation là kết hợp id của seller và buyer, còn không phải là seller thì trường id của
    //coversation là kết hợp id của buyer và seller
    id: req.isSeller ? req.userId + req.body.to : req.body.to + req.userId,
    //nếu là seller thì sellerId là id của người bán, còn không là seller thì sellerId là id của người nhận yêu cầu
    sellerId: req.isSeller ? req.userId : req.body.to,
    //tương tự trên
    buyerId: req.isSeller ? req.body.to : req.userId,
    readBySeller: req.isSeller,
    readByBuyer: !req.isSeller,
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(201).send(savedConversation);
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find(
      req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }
    ).sort({ updatedAt: -1 });
    res.status(200).send(conversations);
  } catch (err) {
    next(err);
  }
};

export const getSingleConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });

    //nếu ko có conversation thì trả về 404, client sẽ dựa vào lỗi 404 để tạo 1 conversation mới
    if (!conversation) return next(createError(404, "Not found!"));
    res.status(200).send(conversation);
  } catch (err) {
    next(err);
  }
};

//đánh dấy là đã đọc
export const updateConversation = async (req, res, next) => {
  try {
    const updatedConversation = await Conversation.findOneAndUpdate(
      {
        id: req.params.id,
      },
      {
        $set: {
          // readBySeller: true,
          // readByBuyer: true,
          ...(req.isSeller ? { readBySeller: true } : { readByBuyer: true }),
        },
      },
      {
        new: true,
      }
    );

    res.status(200).send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

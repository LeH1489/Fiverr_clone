import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Stripe from "stripe";

//thanh toán
export const intent = async (req, res, next) => {
  const stripe = new Stripe(process.env.STRIPE);

  //lấy id của sản phẩm mà user mua thông qua url
  const gig = await Gig.findById(req.params.id);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: gig.price * 100,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  const newOrder = new Order({
    gigId: gig._id,
    img: gig.cover,
    title: gig.title,
    buyerId: req.userId,
    sellerId: gig.userId,
    price: gig.price,
    payment_intent: paymentIntent.id,
  });
  await newOrder.save();

  res.status(200).send({
    clientSecret: paymentIntent.client_secret, //gửi client_secret về cho client
  });
};

//sau khi thanh toán xong thì đánh dấu orders đó đã xong
export const confirm = async (req, res, next) => {
  try {
    const orders = await Order.findOneAndUpdate(
      {
        payment_intent: req.body.payment_intent,
      },
      {
        $set: {
          isCompleted: true,
        },
      }
    );

    res.status(200).send("Order has been confirmed.");
  } catch (err) {
    next(err);
  }
};
// export const createOrder = async (req, res, next) => {
//   try {
//     //tìm gig theo id gửi đến từ client
//     const gig = await Gig.findById(req.params.gigId); //params là params được trích từ url (/gigs/123 ==> params.gigId = 123)

//     //thông tin của 1 order là lấy thông tin từ gig
//     const newOrder = new Order({
//       gigId: gig._id,
//       img: gig.cover,
//       title: gig.title,
//       buyerId: req.userId,
//       sellerId: gig.userId,
//       price: gig.price,
//       payment_intent: "temporary",
//     });
//     await newOrder.save();
//     res.status(200).send("successful");
//   } catch (err) {
//     next(err);
//   }
// };

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }),
      isCompleted: true,
    });
    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};

/*
{...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }), isCompleted: true}: Đây là một đối tượng JavaScript được tạo ra bằng 
cách sử dụng toán tử ba chấm (...) để sao chép các thuộc tính của đối tượng vào đối tượng mới.

Nếu req.isSeller là true, đối tượng được trả về sẽ có thuộc tính sellerId được gán bằng req.userId (id của người dùng thực hiện yêu cầu). 
Điều này đảm bảo rằng chỉ các đơn hàng của người bán đang được trả về nếu req.isSeller là true.

Ngược lại, nếu req.isSeller là false, đối tượng được trả về sẽ có thuộc tính buyerId được gán bằng req.userId. 
Điều này đảm bảo rằng chỉ các đơn hàng của người mua đang được trả về nếu req.isSeller là false.

Đồng thời, đối tượng cũng có một thuộc tính isCompleted được gán bằng true. 
Điều này đảm bảo rằng chỉ các đơn hàng đã hoàn thành (isCompleted là true) mới được trả về.
*/

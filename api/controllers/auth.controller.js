import { info } from "sass";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";

export const register = async (req, res, next) => {
  try {
    //password bị hash lấy từ req của client
    const hash = bcrypt.hashSync(req.body.password, 5);

    //nhận data từ request của client (json)
    //User là model của mongo
    const newUser = new User({
      ...req.body, //còn lại lấy từ req của client
      password: hash, //password lấy từ hash
    });

    await newUser.save();
    res.status(201).send("User has been created.");
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    //findOne là method của mongo, tìm user theo username
    const user = await User.findOne({ username: req.body.username });

    if (!user) return next(createError(404, "User not found!"));

    //so sánh password
    const isCorrect = bcrypt.compareSync(req.body.password, user.password);

    if (!isCorrect)
      return next(createError(400, "Wrong password or username!"));

    //tạo 1 token chứa id của user và một cờ để coi user có phải là seller hay không
    //cú pháp: jwt.sign(payload, secretOrPrivateKey, [options, callback])
    const token = jwt.sign(
      {
        id: user._id,
        isSeller: user.isSeller,
      },
      process.env.JWT_KEY //secret key
    );

    //destructering, tách password và các thông tin khác của user
    const { password, ...info } = user._doc;

    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .send(info); //chỉ gửi info, không gửi password, và gửi token thông qua cookie tên là accessToken
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out.");
};

import mongoose, { Types } from "mongoose";

const { Schema, model } = mongoose;

// City Schema Interface
export interface ICity extends Document {
  _id: Types.ObjectId;
  name: string; // Name of the city
  businesses: { name: string; id: Types.ObjectId }[]; // List of businesses in the city
}

// City Schema
const citySchema = new Schema({
  name: { type: String, required: true, unique: true },
  businesses: [
    {
      name: { type: String, required: true },
      id: { type: Schema.Types.ObjectId, ref: "newBusiness", required: true },
    },
  ],
});

export default model<ICity>("newCity", citySchema);

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    game_no: { type: Number, required: true },
    team_one: { type: [Object], required: true },
    team_two: { type: [Object], required: true },
    play_time: {type: String,required : true},
}, { timestamps: true });

export default userSchema; // <-- export the Schema, NOT the model

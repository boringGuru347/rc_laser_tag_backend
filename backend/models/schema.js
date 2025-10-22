import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
});

export default studentSchema; // <-- export Schema

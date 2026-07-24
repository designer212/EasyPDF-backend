const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const ILovePDFFile = require('@ilovepdf/ilovepdf-nodejs/lib/ILovePDFFile');

const app = express();

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Put your actual iLovePDF API keys here
const PUBLIC_KEY = 'project_public_b2471d300d2f2ae04aee35292ba73da6_famXm3132906010dfc141c10c00a342d77723';
const SECRET_KEY = 'secret_key_13f56ba9bbe8b631f1611d4b324897f8_D4zAN24ecf913551079055c3caaa93a772056';
const ilovepdf = new ILovePDFApi(PUBLIC_KEY, SECRET_KEY);

// Universal route that handles all tools dynamically
app.post('/api/process/:tool', upload.single('file'), async (req, res) => {
    const toolName = req.params.tool;
    const filePath = req.file ? req.file.path : null;

    if (!filePath) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const task = ilovepdf.newTask(toolName);
        await task.start();
        
        // Wrap the file using ILovePDFFile and an absolute path
        const file = new ILovePDFFile(path.resolve(__dirname, filePath));
        await task.addFile(file);

        await task.process();
        const data = await task.download();
        
        // Clean up temporary local file
        fs.unlinkSync(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.send(data);

    } catch (error) {
        console.error(`Error processing tool [${toolName}]:`, error.response?.data || error.message || error);
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).send({ error: 'Failed to process document.' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('easypdf backend server running');
});


const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');

const app = express();
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
        await task.addFile(filePath);
        await task.process();
        const data = await task.download();
        
        // Clean up temporary local file
        fs.unlinkSync(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.send(data);

    } catch (error) {
        console.error(`Error processing tool [${toolName}]:`, error);
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).send({ error: 'Failed to process document.' });
    }
});

app.listen(3000, () => {
    console.log('easypdf backend server running on port 3000');
});

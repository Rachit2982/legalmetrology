import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  FileDownload,
  TableChart,
  Folder,
  CheckCircle,
  Info
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import dayjs from 'dayjs';

const ExportData = () => {
  const [traders, setTraders] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalTraders: 0,
    totalFiles: 0,
    dataSize: 0
  });

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = () => {
    const savedTraders = JSON.parse(localStorage.getItem('traders') || '[]');
    setTraders(savedTraders);
    
    // Calculate stats
    let totalFiles = 0;
    let dataSize = 0;
    
    savedTraders.forEach(trader => {
      // Check for certificate file
      const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
      if (certFileData) {
        try {
          const certData = JSON.parse(certFileData);
          if (certData.content) {
            totalFiles++;
            dataSize += certData.size || 0;
          }
        } catch (error) {
          console.error('Error parsing certificate file data:', error);
        }
      }
      
      // Check for indent file
      const indentFileData = localStorage.getItem(`file_${trader.id}_indent`);
      if (indentFileData) {
        try {
          const indentData = JSON.parse(indentFileData);
          if (indentData.content) {
            totalFiles++;
            dataSize += indentData.size || 0;
          }
        } catch (error) {
          console.error('Error parsing indent file data:', error);
        }
      }
    });
    
    setStats({
      totalTraders: savedTraders.length,
      totalFiles,
      dataSize
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createExcelFile = () => {
    const excelData = traders.map((trader, index) => {
      // Get actual file information from stored data
      let certificateInfo = 'Not uploaded';
      let indentInfo = 'Not uploaded';
      let certificateBase64 = '';
      let indentBase64 = '';
      
      const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
      if (certFileData) {
        try {
          const certData = JSON.parse(certFileData);
          if (certData.content && certData.name) {
            certificateInfo = `${certData.name} (${formatFileSize(certData.size)})`;
            certificateBase64 = certData.content;
          }
        } catch (error) {
          console.error('Error parsing certificate file data:', error);
        }
      }
      
      const indentFileData = localStorage.getItem(`file_${trader.id}_indent`);
      if (indentFileData) {
        try {
          const indentData = JSON.parse(indentFileData);
          if (indentData.content && indentData.name) {
            indentInfo = `${indentData.name} (${formatFileSize(indentData.size)})`;
            indentBase64 = indentData.content;
          }
        } catch (error) {
          console.error('Error parsing indent file data:', error);
        }
      }

      return {
        'S.No': index + 1,
        'Trader ID': trader.traderId || '',
        'Number of Items': trader.numberOfItems || '',
        'Indent/Certificate No.': trader.indentCertificateNo || '',
        'Beam Scale': trader.beamScale || '',
        'Iron Weight Hexagonal': trader.ironWeightHexagonal || '',
        'Meter/Map': trader.meterMap || '',
        'Counter': trader.counter || '',
        'Bullion': trader.bullion || '',
        'E.W.M.': trader.ewm || '',
        'Total No. of Items': trader.totalNoOfItems || '',
        'Fee Amount (₹)': trader.feeAmount || '',
        'Subscription Period (Years)': trader.subscriptionPeriod || '',
        'Fee Submission Date': trader.feeSubmissionDate ? dayjs(trader.feeSubmissionDate).format('DD/MM/YYYY') : '',
        'Re-verification Date': trader.reVerificationDate ? dayjs(trader.reVerificationDate).format('DD/MM/YYYY') : '',
        'Days Until Re-verification': trader.reVerificationDate ? dayjs(trader.reVerificationDate).diff(dayjs(), 'day') : '',
        'Certificate File': certificateInfo,
        'Certificate Data': certificateBase64 ? 'PDF_DATA_EMBEDDED' : 'No file',
        'Indent File': indentInfo,
        'Indent Data': indentBase64 ? 'PDF_DATA_EMBEDDED' : 'No file',
        'Status': (() => {
          if (!trader.reVerificationDate) return 'Unknown';
          const daysUntil = dayjs(trader.reVerificationDate).diff(dayjs(), 'day');
          if (daysUntil < 0) return 'Expired';
          if (daysUntil <= 30) return 'Expiring Soon';
          return 'Active';
        })(),
        'Created Date': trader.createdAt ? dayjs(trader.createdAt).format('DD/MM/YYYY HH:mm') : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 8 },   // S.No
      { wch: 15 },  // Trader ID
      { wch: 12 },  // Number of Items
      { wch: 20 },  // Indent/Certificate No.
      { wch: 15 },  // Beam Scale
      { wch: 18 },  // Iron Weight Hexagonal
      { wch: 15 },  // Meter/Map
      { wch: 12 },  // Counter
      { wch: 12 },  // Bullion
      { wch: 12 },  // E.W.M.
      { wch: 15 },  // Total No. of Items
      { wch: 15 },  // Fee Amount
      { wch: 12 },  // Subscription Period
      { wch: 18 },  // Fee Submission Date
      { wch: 18 },  // Re-verification Date
      { wch: 20 },  // Days Until Re-verification
      { wch: 30 },  // Certificate File
      { wch: 20 },  // Certificate Data
      { wch: 30 },  // Indent File
      { wch: 20 },  // Indent Data
      { wch: 15 },  // Status
      { wch: 20 }   // Created Date
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Traders Data');

    // Add summary sheet
    const summaryData = [
      ['Legal Metrology Trader Management System - Export Summary'],
      [''],
      ['Export Date:', dayjs().format('DD/MM/YYYY HH:mm')],
      ['Total Traders:', traders.length],
      ['Total Files:', stats.totalFiles],
      ['Data Size:', formatFileSize(stats.dataSize)],
      [''],
      ['Status Summary:'],
      ['Active Traders:', traders.filter(t => {
        if (!t.reVerificationDate) return false;
        return dayjs(t.reVerificationDate).diff(dayjs(), 'day') > 30;
      }).length],
      ['Expiring Soon:', traders.filter(t => {
        if (!t.reVerificationDate) return false;
        const days = dayjs(t.reVerificationDate).diff(dayjs(), 'day');
        return days >= 0 && days <= 30;
      }).length],
      ['Expired:', traders.filter(t => {
        if (!t.reVerificationDate) return false;
        return dayjs(t.reVerificationDate).diff(dayjs(), 'day') < 0;
      }).length],
      [''],
      ['New Fields Added:'],
      ['- Number of Items'],
      ['- Indent/Calibration Certificate No.'],
      ['- Beam Scale'],
      ['- Iron Weight Hexagonal'],
      ['- Meter/Map'],
      ['- Counter'],
      ['- Bullion'],
      ['- E.W.M.'],
      ['- Total No. of Items'],
      [''],
      ['PDF File Information:'],
      ['- Certificate Data and Indent Data columns contain embedded PDF information'],
      ['- Actual PDF files are also included in the ZIP package for easy access'],
      ['- Files can be opened directly from the "files" folder in the ZIP']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 50 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');

    // Add PDF Data sheet with base64 content
    const pdfDataSheet = [];
    pdfDataSheet.push(['Trader ID', 'File Type', 'File Name', 'Base64 Content']);
    
    traders.forEach(trader => {
      // Add certificate data
      const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
      if (certFileData) {
        try {
          const certData = JSON.parse(certFileData);
          if (certData.content) {
            pdfDataSheet.push([
              trader.traderId,
              'Certificate',
              certData.name,
              certData.content
            ]);
          }
        } catch (error) {
          console.error('Error processing certificate:', error);
        }
      }
      
      // Add indent data
      const indentFileData = localStorage.getItem(`file_${trader.id}_indent`);
      if (indentFileData) {
        try {
          const indentData = JSON.parse(indentFileData);
          if (indentData.content) {
            pdfDataSheet.push([
              trader.traderId,
              'Indent',
              indentData.name,
              indentData.content
            ]);
          }
        } catch (error) {
          console.error('Error processing indent:', error);
        }
      }
    });

    if (pdfDataSheet.length > 1) {
      const pdfSheet = XLSX.utils.aoa_to_sheet(pdfDataSheet);
      pdfSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 100 }];
      XLSX.utils.book_append_sheet(workbook, pdfSheet, 'PDF Data (Base64)');
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const zip = new JSZip();
      
      // Create Excel file with embedded PDF data
      const excelData = createExcelFile();
      zip.file('Legal_Metrology_Traders_Complete_Data.xlsx', excelData);
      
      // Create files folder for actual PDF files
      const filesFolder = zip.folder('files');
      
      // Add trader files to zip
      for (const trader of traders) {
        // Add certificate file if exists
        const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
        if (certFileData) {
          try {
            const fileInfo = JSON.parse(certFileData);
            if (fileInfo.content) {
              // Convert base64 data URL to binary data
              const base64Data = fileInfo.content.split(',')[1];
              const binaryData = atob(base64Data);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              filesFolder.file(`${trader.traderId}_certificate_${fileInfo.name}`, bytes);
            }
          } catch (error) {
            console.error('Error processing certificate file:', error);
          }
        }
        
        // Add indent file if exists
        const indentFileData = localStorage.getItem(`file_${trader.id}_indent`);
        if (indentFileData) {
          try {
            const fileInfo = JSON.parse(indentFileData);
            if (fileInfo.content) {
              // Convert base64 data URL to binary data
              const base64Data = fileInfo.content.split(',')[1];
              const binaryData = atob(base64Data);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              filesFolder.file(`${trader.traderId}_indent_${fileInfo.name}`, bytes);
            }
          } catch (error) {
            console.error('Error processing indent file:', error);
          }
        }
      }
      
      // Add comprehensive readme file
      zip.file('README.txt', `Legal Metrology Trader Management System - Complete Data Export

Export Date: ${dayjs().format('DD/MM/YYYY HH:mm')}
Total Traders: ${traders.length}
Total Files: ${stats.totalFiles}
Data Size: ${formatFileSize(stats.dataSize)}

CONTENTS:
========
- Legal_Metrology_Traders_Complete_Data.xlsx: Complete database with ALL trader information
- files/: Folder containing all uploaded PDF certificates and indents
- README.txt: This instruction file

EXCEL FILE STRUCTURE:
====================
Sheet 1: "Traders Data" - Main data with all fields including:
  • Basic Information (Trader ID, Items, Certificate No.)
  • Equipment Details (Beam Scale, Iron Weight, Meter/Map, Counter, Bullion, E.W.M.)
  • Dates and Status Information
  • File Information with embedded data indicators

Sheet 2: "Export Summary" - Overview and statistics
Sheet 3: "PDF Data (Base64)" - Raw PDF file data in base64 format for programmatic access

NEW FIELDS INCLUDED:
===================
✓ Number of Items
✓ Indent/Calibration Certificate No.
✓ Beam Scale
✓ Iron Weight Hexagonal
✓ Meter/Map
✓ Counter
✓ Bullion
✓ E.W.M.
✓ Total No. of Items

PDF FILE HANDLING:
=================
- PDFs are embedded as base64 data in the Excel file
- Original PDF files are also included in the "files" folder
- Each trader's files are named with their Trader ID for easy identification
- Both certificate and indent files are preserved with original names

INSTRUCTIONS:
============
1. Open the Excel file to view all trader information
2. The "PDF Data (Base64)" sheet contains raw file data for advanced users
3. Physical PDF files can be accessed from the "files" folder
4. File names follow the pattern: [TraderID]_[type]_[originalname]

AUTHENTICATION NOTES:
====================
- This system now uses email-based authentication
- Each user's data is associated with their account
- Default admin credentials have been removed for security

Generated by Legal Metrology Trader Management System v2.0
Developed with enhanced security and comprehensive data management`);
      
      // Generate and download ZIP file
      const zipData = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipData);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Legal_Metrology_Complete_Export_${dayjs().format('YYYY-MM-DD_HH-mm')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Export Complete Data
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Export Overview
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {stats.totalTraders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Traders
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {stats.totalFiles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      PDF Files
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {formatFileSize(stats.dataSize)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Data Size
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity="success" sx={{ mb: 3 }}>
                <strong>Enhanced Export Features:</strong> PDFs are now embedded directly in Excel with base64 encoding, 
                plus original files are included in the ZIP for maximum compatibility and accessibility.
              </Alert>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                What's Included in Export:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TableChart color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Complete Excel Database"
                    secondary="All trader fields including new equipment details (Beam Scale, Iron Weight, etc.) with embedded PDF data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Folder color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Original PDF Files"
                    secondary="All certificates and indents in their original format in a separate files folder"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Base64 PDF Data Sheet"
                    secondary="Raw PDF data embedded in Excel for programmatic access and data recovery"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<FileDownload />}
                  onClick={handleExport}
                  disabled={exporting || traders.length === 0}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {exporting ? 'Creating Complete Export...' : 'Export Complete Data Package'}
                </Button>
                
                {exporting && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Creating comprehensive ZIP with Excel data, embedded PDFs, and original files...
                    </Typography>
                  </Box>
                )}
                
                {traders.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No trader data available to export. Add some traders first.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Export Instructions
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Step 1"
                    secondary="Click 'Export Complete Data Package' button"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Step 2"
                    secondary="Save the ZIP file to your computer"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Step 3"
                    secondary="Extract ZIP to access Excel + PDF files"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Step 4"
                    secondary="Open Excel to view all data with embedded PDF info"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>New Features:</strong> All new form fields are included, PDFs are embedded in Excel, 
                  and separate authentication means each user only sees their own data.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportData;

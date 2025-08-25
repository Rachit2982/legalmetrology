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
      // Get actual file names from stored data
      let certificateFileName = 'Not uploaded';
      let indentFileName = 'Not uploaded';

      const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
      if (certFileData) {
        try {
          const certData = JSON.parse(certFileData);
          if (certData.content && certData.name) {
            certificateFileName = `./files/${trader.id}_certificate_${certData.name}`;
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
            indentFileName = `./files/${trader.id}_indent_${indentData.name}`;
          }
        } catch (error) {
          console.error('Error parsing indent file data:', error);
        }
      }

      return {
        'S.No': index + 1,
        'Trader ID': trader.traderId,
        'Challan Number': trader.challanNumber,
        'Trader Name': trader.name,
        'Fee Amount (₹)': trader.feeAmount,
        'Subscription Period (Years)': trader.subscriptionPeriod,
        'Fee Submission Date': dayjs(trader.feeSubmissionDate).format('DD/MM/YYYY'),
        'Re-verification Date': dayjs(trader.reVerificationDate).format('DD/MM/YYYY'),
        'Days Until Re-verification': dayjs(trader.reVerificationDate).diff(dayjs(), 'day'),
        'Certificate File': certificateFileName,
        'Indent File': indentFileName,
        'Status': (() => {
          const daysUntil = dayjs(trader.reVerificationDate).diff(dayjs(), 'day');
          if (daysUntil < 0) return 'Expired';
          if (daysUntil <= 30) return 'Expiring Soon';
          return 'Active';
        })(),
        'Created Date': dayjs(trader.createdAt).format('DD/MM/YYYY HH:mm')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 8 },   // S.No
      { wch: 15 },  // Trader ID
      { wch: 20 },  // Challan Number
      { wch: 25 },  // Trader Name
      { wch: 15 },  // Fee Amount
      { wch: 12 },  // Subscription Period
      { wch: 18 },  // Fee Submission Date
      { wch: 18 },  // Re-verification Date
      { wch: 20 },  // Days Until Re-verification
      { wch: 30 },  // Certificate File
      { wch: 30 },  // Indent File
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
      ['Active Traders:', traders.filter(t => dayjs(t.reVerificationDate).diff(dayjs(), 'day') > 30).length],
      ['Expiring Soon:', traders.filter(t => {
        const days = dayjs(t.reVerificationDate).diff(dayjs(), 'day');
        return days >= 0 && days <= 30;
      }).length],
      ['Expired:', traders.filter(t => dayjs(t.reVerificationDate).diff(dayjs(), 'day') < 0).length],
      [''],
      ['Instructions:'],
      ['1. Extract the ZIP file to access all data'],
      ['2. Open the Excel file to view trader information'],
      ['3. Click on file links in Excel to open associated documents'],
      ['4. All files are organized in the "files" folder']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const zip = new JSZip();
      
      // Create Excel file
      const excelData = createExcelFile();
      zip.file('Legal_Metrology_Traders_Data.xlsx', excelData);
      
      // Create files folder
      const filesFolder = zip.folder('files');
      
      // Add trader files to zip
      for (const trader of traders) {
        // Add certificate file if exists
        const certFileData = localStorage.getItem(`file_${trader.id}_certificate`);
        if (certFileData && trader.certificateFile) {
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
              filesFolder.file(`${trader.id}_certificate_${fileInfo.name}`, bytes);
            }
          } catch (error) {
            console.error('Error processing certificate file:', error);
          }
        }

        // Add indent file if exists
        const indentFileData = localStorage.getItem(`file_${trader.id}_indent`);
        if (indentFileData && trader.indentFile) {
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
              filesFolder.file(`${trader.id}_indent_${fileInfo.name}`, bytes);
            }
          } catch (error) {
            console.error('Error processing indent file:', error);
          }
        }
      }
      
      // Add readme file
      zip.file('README.txt', `Legal Metrology Trader Management System - Data Export
      
Export Date: ${dayjs().format('DD/MM/YYYY HH:mm')}
Total Traders: ${traders.length}
Total Files: ${stats.totalFiles}

CONTENTS:
- Legal_Metrology_Traders_Data.xlsx: Complete trader database with hyperlinks to files
- files/: Folder containing all uploaded certificates and indents
- README.txt: This file

INSTRUCTIONS:
1. Open the Excel file to view all trader information
2. Click on file links in the Certificate File and Indent File columns to open associated documents
3. All uploaded files are organized in the "files" folder
4. The Export Summary sheet contains an overview of the data

NOTES:
- File links in Excel are relative paths to the files folder
- Ensure the folder structure is maintained for proper file access
- This export contains all trader data as of the export date

Generated by Legal Metrology Trader Management System`);
      
      // Generate and download ZIP file
      const zipData = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipData);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Legal_Metrology_Export_${dayjs().format('YYYY-MM-DD_HH-mm')}.zip`;
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
        Export Data
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
                      Uploaded Files
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

              <Alert severity="info" sx={{ mb: 3 }}>
                The export will include all trader data in Excel format with hyperlinks to uploaded files. 
                Everything will be packaged in a convenient ZIP file for easy sharing and backup.
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
                    primary="Excel Spreadsheet"
                    secondary="Complete trader database with all fields and calculated status information"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Folder color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uploaded Files"
                    secondary="All certificates and indents organized in a files folder"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Documentation"
                    secondary="README file with instructions and export summary"
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
                  {exporting ? 'Preparing Export...' : 'Export All Data'}
                </Button>
                
                {exporting && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Creating ZIP file with Excel data and uploaded files...
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
                    secondary="Click 'Export All Data' button"
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
                    secondary="Extract the ZIP file contents"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Step 4"
                    secondary="Open Excel file to view data with file links"
                  />
                </ListItem>
              </List>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Keep the folder structure intact to ensure file links in Excel work properly.
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

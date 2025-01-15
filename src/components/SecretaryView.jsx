import React, { useState, useEffect } from 'react';
    import { useAuth } from '../AuthContext';
    import { useNavigate } from 'react-router-dom';
    import { jsPDF } from 'jspdf';
    import ReactQuill from 'react-quill';
    import 'react-quill/dist/quill.snow.css';
    import { db } from '../firebase';
    import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

    const modules = {
      toolbar: [
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
    };

    const SecretaryView = () => {
      const [documents, setDocuments] = useState([]);
      const [selectedDocument, setSelectedDocument] = useState(null);
      const [editedContent, setEditedContent] = useState('');
      const { user, logout } = useAuth();
      const navigate = useNavigate();

      useEffect(() => {
        const fetchDocuments = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "documents"));
            const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDocuments(docs);
          } catch (error) {
            console.error("Error fetching documents: ", error);
          }
        };
        fetchDocuments();
      }, []);

      const handleStatusChange = async (documentId, newStatus) => {
        try {
          const docRef = doc(db, "documents", documentId);
          await updateDoc(docRef, { status: newStatus, content: editedContent });
          const updatedDocuments = documents.map(doc => {
            if (doc.id === documentId) {
              return { ...doc, status: newStatus, content: editedContent };
            }
            return doc;
          });
          setDocuments(updatedDocuments);
        } catch (e) {
          console.error("Error updating document: ", e);
        }
        setSelectedDocument(null);
        setEditedContent('');
      };

      const handleEditDocument = (doc) => {
        setSelectedDocument(doc);
        setEditedContent(doc.content);
      };

      const handleCancelEdit = () => {
        setSelectedDocument(null);
        setEditedContent('');
      };

      const handleLogout = () => {
        logout();
        navigate('/');
      };

      const handleGeneratePdf = async () => {
        if (selectedDocument) {
          const pdf = new jsPDF();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // Hospital Info (Top Right)
          const hospitalName = 'City General Hospital';
          const hospitalAddress = '123 Hospital Rd, Anytown';
          const hospitalTextWidth = pdf.getTextWidth(hospitalName);
          const hospitalAddressWidth = pdf.getTextWidth(hospitalAddress);
          const hospitalX = pageWidth - Math.max(hospitalTextWidth, hospitalAddressWidth) - 10;

          pdf.setFontSize(12);
          pdf.text(hospitalName, hospitalX, 20);
          pdf.setFontSize(10);
          pdf.text(hospitalAddress, hospitalX, 28);

          // Patient Info (Top Left)
          pdf.setFontSize(12);
          pdf.text(`Patient: ${selectedDocument.patient.name}`, 10, 20);
          pdf.setFontSize(10);
          pdf.text(`Address: ${selectedDocument.patient.address}`, 10, 28);

          // Document Content (Below Addresses)
          const contentY = 40;
          pdf.setFontSize(11);

          // Scale HTML content to fit page
          const contentWidth = pageWidth - 20;
          const contentHeight = pageHeight - contentY - 50; // Leave space for signature
          let scaleFactor = 1;

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = editedContent;
          document.body.appendChild(tempDiv);

          const tempDivWidth = tempDiv.offsetWidth;
          const tempDivHeight = tempDiv.offsetHeight;

          document.body.removeChild(tempDiv);

          if (tempDivWidth > contentWidth) {
            scaleFactor = Math.min(scaleFactor, contentWidth / tempDivWidth);
          }

          if (tempDivHeight > contentHeight) {
            scaleFactor = Math.min(scaleFactor, contentHeight / tempDivHeight);
          }

          await pdf.html(tempDiv.innerHTML, { // Use tempDiv.innerHTML here
            x: 10,
            y: contentY,
            width: contentWidth,
            windowWidth: contentWidth,
            html2canvas: {
              scale: scaleFactor,
            },
          });

          // Signature Line
          const signatureY = pageHeight - 40;
          pdf.line(10, signatureY, pageWidth - 10, signatureY);
          pdf.setFontSize(10);
          pdf.text('Clinician Signature', 10, signatureY + 5);

          pdf.save(`document_${selectedDocument.id}.pdf`);
        }
      };

      if (selectedDocument) {
        return (
          <div className="container">
            <h1>Edit Document</h1>
            <p>Patient Name: {selectedDocument.patient.name}</p>
            <p>Patient DOB: {selectedDocument.patient.dob}</p>
            <p>Patient MRN: {selectedDocument.patient.mrn}</p>
            <ReactQuill value={editedContent} onChange={setEditedContent} modules={modules} />
            <div className="button-container">
              <button onClick={() => handleStatusChange(selectedDocument.id, 'pending_clinician')}>
                Send to Clinician
              </button>
              <button onClick={handleCancelEdit}>Cancel</button>
              <button onClick={handleGeneratePdf}>Generate PDF</button>
            </div>
          </div>
        );
      }

      return (
        <div className="container">
          <h1>Secretary View</h1>
          <table>
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Patient Name</th>
                <th>Patient DOB</th>
                <th>Patient MRN</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.id}</td>
                  <td>{doc.patient.name}</td>
                  <td>{doc.patient.dob}</td>
                  <td>{doc.patient.mrn}</td>
                  <td>{doc.status}</td>
                  <td>
                    {doc.status === 'pending_secretary' && (
                      <button onClick={() => handleEditDocument(doc)}>
                        Edit
                      </button>
                    )}
                    {doc.status === 'pending_clinician' && (
                      <span>Pending Clinician Review</span>
                    )}
                    {doc.status === 'completed' && (
                      <span>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-container">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      );
    };

    export default SecretaryView;

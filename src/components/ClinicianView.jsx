import React, { useState, useEffect } from 'react';
    import { useNavigate, useLocation } from 'react-router-dom';
    import { useAuth } from '../AuthContext';
    import ReactQuill from 'react-quill';
    import 'react-quill/dist/quill.snow.css';
    import { db } from '../firebase';
    import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
    import Schedule from './Schedule';

    const modules = {
      toolbar: [
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
    };

    const ClinicianView = () => {
      const [patients, setPatients] = useState([]);
      const [selectedPatient, setSelectedPatient] = useState(null);
      const [documentContent, setDocumentContent] = useState('');
      const [myDocuments, setMyDocuments] = useState([]);
      const [showMyDocuments, setShowMyDocuments] = useState(false);
      const [selectedDocument, setSelectedDocument] = useState(null);
      const [editedContent, setEditedContent] = useState('');
      const [searchTerm, setSearchTerm] = useState('');
      const [showSchedule, setShowSchedule] = useState(false);
      const navigate = useNavigate();
      const location = useLocation();
      const { user, logout } = useAuth();

      useEffect(() => {
        const fetchPatients = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "patients"));
            const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPatients(docs);
          } catch (error) {
            console.error("Error fetching patients: ", error);
          }
        };

        const fetchDocuments = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "documents"));
            const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setMyDocuments(docs.filter(doc => doc.clinician?.role === 'clinician'));
          } catch (error) {
            console.error("Error fetching documents: ", error);
          }
        };

        fetchPatients();
        fetchDocuments();
      }, []);

      useEffect(() => {
        if (location.state && location.state.selectedPatient) {
          setSelectedPatient(location.state.selectedPatient);
        } else {
          setSelectedPatient(null);
        }
      }, [location]);

      const getNextDocumentId = () => {
        return Date.now();
      };

      const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
      };

      const handleSendToSecretary = async () => {
        const newDocument = {
          id: getNextDocumentId(),
          patient: selectedPatient,
          content: documentContent,
          status: 'pending_secretary',
          clinician: user,
        };
        try {
          await addDoc(collection(db, "documents"), newDocument);
          setMyDocuments(prev => [...prev, newDocument]);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
        setSelectedPatient(null);
        setDocumentContent('');
      };

      const handleCompleteDocument = async () => {
        if (selectedDocument) {
          try {
            const docRef = doc(db, "documents", selectedDocument.id);
            await updateDoc(docRef, { status: 'completed', content: editedContent });
            const updatedDocuments = myDocuments.map(doc => {
              if (doc.id === selectedDocument.id) {
                return { ...doc, status: 'completed', content: editedContent };
              }
              return doc;
            });
            setMyDocuments(updatedDocuments);
          } catch (e) {
            console.error("Error updating document: ", e);
          }
        }
        setSelectedDocument(null);
        setEditedContent('');
        setShowMyDocuments(true);
      };

      const handleSendBackToSecretary = async () => {
          if (selectedDocument) {
            try {
              const docRef = doc(db, "documents", selectedDocument.id);
              await updateDoc(docRef, { status: 'pending_secretary', content: editedContent });
              const updatedDocuments = myDocuments.map(doc => {
                if (doc.id === selectedDocument.id) {
                  return { ...doc, status: 'pending_secretary', content: editedContent };
                }
                return doc;
              });
              setMyDocuments(updatedDocuments);
            } catch (e) {
              console.error("Error updating document: ", e);
            }
          }
          setSelectedDocument(null);
          setEditedContent('');
          setShowMyDocuments(true);
      };

      const handleEditDocument = (doc) => {
          setSelectedDocument(doc);
          setEditedContent(doc.content);
          setShowMyDocuments(false);
      };

      const saveDocument = async (document) => {
        try {
          await addDoc(collection(db, "documents"), document);
          setMyDocuments(prev => [...prev, document]);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      };

      const handleLogout = () => {
        logout();
        navigate('/');
      };

      const handleMyDocumentsClick = () => {
        setShowMyDocuments(!showMyDocuments);
        setSelectedDocument(null);
        setEditedContent('');
      };

      const handleCancelEdit = () => {
          setSelectedDocument(null);
          setEditedContent('');
          setShowMyDocuments(true);
      };

      const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
      };

      const filteredPatients = () => {
        if (!searchTerm) {
          return patients;
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return patients.filter(patient =>
          patient.name.toLowerCase().includes(lowerSearchTerm) ||
          patient.mrn.includes(lowerSearchTerm)
        );
      };

      const getRowColor = (status) => {
        switch (status) {
          case 'completed':
            return '#ccffcc';
          case 'pending_secretary':
            return '#ffffcc';
          case 'pending_clinician':
            return '#ffcccc';
          default:
            return 'white';
        }
      };

      const handleScheduleClick = () => {
        setShowSchedule(!showSchedule);
      };

      if (showSchedule) {
        return <Schedule patients={patients} onBack={() => setShowSchedule(false)} />;
      }

      if (selectedDocument) {
          return (
              <div className="container">
                  <h1>Review Document</h1>
                  <p>Patient Name: {selectedDocument.patient?.name}</p>
                  <p>Patient DOB: {selectedDocument.patient?.dob}</p>
                  <p>Patient MRN: {selectedDocument.patient?.mrn}</p>
                  <ReactQuill value={editedContent} onChange={setEditedContent} modules={modules} />
                  <div className="button-container">
                    <button onClick={handleSendBackToSecretary}>Send to Secretary</button>
                    <button onClick={handleCompleteDocument}>Complete Document</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </div>
              </div>
          );
      }

      if (showMyDocuments) {
        return (
          <div className="container">
            <h1>My Documents</h1>
            <table>
              <thead>
                <tr>
                  <th>Document ID</th>
                  <th>Patient Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myDocuments.map((doc) => (
                  <tr key={doc.id} style={{ backgroundColor: getRowColor(doc.status) }}>
                    <td>{doc.id}</td>
                    <td>{doc.patient.name}</td>
                    <td>{doc.status}</td>
                    <td>
                        {doc.status === 'pending_clinician' && (
                            <button onClick={() => handleEditDocument(doc)}>Review</button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="button-container">
              <button onClick={handleMyDocumentsClick}>Back to Patient Select</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        );
      }

      if (!selectedPatient) {
        return (
          <div className="container">
            <h1>Select a Patient</h1>
            <input
              type="text"
              placeholder="Search by name or MRN"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>MRN</th>
                  <th>Address</th>
                  <th>Referrer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients().map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.name}</td>
                    <td>{patient.dob}</td>
                    <td>{patient.mrn}</td>
                    <td>{patient.address}</td>
                    <td>{patient.referrer}</td>
                    <td>
                      <button onClick={() => handlePatientSelect(patient)}>Select</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="button-container">
              <button onClick={handleMyDocumentsClick}>My Documents</button>
              <button onClick={handleScheduleClick}>Schedule</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        );
      }

      return (
        <div className="container">
          <h1>Patient Details</h1>
          {selectedPatient && (
            <>
              <p>Name: {selectedPatient.name}</p>
              <p>Date of Birth: {selectedPatient.dob}</p>
              <p>MRN: {selectedPatient.mrn}</p>
            </>
          )}

          <h2>Document Content</h2>
          <ReactQuill value={documentContent} onChange={setDocumentContent} modules={modules} />

          <div className="button-container">
            <button onClick={handleSendToSecretary}>Send to Secretary</button>
            <button onClick={handleCompleteDocument}>Complete Document</button>
            <button onClick={handleMyDocumentsClick}>My Documents</button>
            <button onClick={handleScheduleClick}>Schedule</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      );
    };

    export default ClinicianView;

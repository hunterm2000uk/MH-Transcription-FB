import React, { useState, useEffect } from 'react';
    import { db } from '../firebase';
    import { collection, getDocs } from 'firebase/firestore';
    import { useNavigate } from 'react-router-dom';

    const Schedule = ({ patients, onBack }) => {
      const [appointments, setAppointments] = useState([]);
      const [currentDate, setCurrentDate] = useState(new Date());
      const navigate = useNavigate();

      useEffect(() => {
        const fetchAppointments = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "appointments"));
            const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAppointments(docs);
          } catch (error) {
            console.error("Error fetching appointments: ", error);
          }
        };
        fetchAppointments();
      }, []);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const getAppointmentsForDay = () => {
        const dateString = formatDate(currentDate);
        return appointments
          .filter(appointment => appointment.date === dateString)
          .sort((a, b) => {
            const timeA = parseInt(a.time.split(':')[0]);
            const timeB = parseInt(b.time.split(':')[0]);
            return timeA - timeB;
          });
      };

      const handlePrevDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
      };

      const handleNextDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
      };

      const handleAppointmentClick = (appointment, event) => {
        event.stopPropagation();
        const patient = patients.find(p => p.id === appointment.patientId);
        if (patient) {
          navigate('/clinician', { state: { selectedPatient: patient } });
        }
      };

      const formattedDate = formatDate(currentDate);

      return (
        <div className="container">
          <h1>Schedule</h1>
          <div className="calendar-header">
            <button onClick={handlePrevDay}>&lt;</button>
            <h2>{formattedDate}</h2>
            <button onClick={handleNextDay}>&gt;</button>
          </div>
          <div className="schedule-list">
            {getAppointmentsForDay().map(appointment => {
              const patient = patients.find(p => p.id === appointment.patientId);
              return (
                <div
                  key={appointment.id}
                  className="appointment-item"
                >
                  <span className="appointment-time">{appointment.time}</span>
                  <span className="appointment-patient">{patient ? patient.name : 'Unknown'}</span>
                  <button className="select-button" onClick={(event) => handleAppointmentClick(appointment, event)}>Select</button>
                </div>
              );
            })}
          </div>
          <div className="button-container">
            <button onClick={onBack}>Back to Patient Select</button>
          </div>
        </div>
      );
    };

    export default Schedule;

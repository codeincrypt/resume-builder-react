import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Resume = ({data}) => {
  const resumeRef = useRef();

  const handleDownloadPDF = async () => {
    const element = resumeRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("resume.pdf");
  };

  return (
    <div>
      <div ref={resumeRef} style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>{data?.name}</h1>
        <p>Email: {data?.email}</p>
        <p>Phone: {data?.phone}</p>
        <hr />
        <h2>Professional Summary</h2>
        <p>
        {data?.professional_summary}
        </p>
        <h2>Experience</h2>
        {data?.experience.map((item, index) => {
          return (
            <div key={index}>
              <h3>{item.company}</h3>
              <p>{item.position}</p>
              <p>
                {item.start_date} - {item.end_date? item.end_date : "Present"}
              </p>
              <p>{item.summary}</p>
              {/* <ul>
                {item.summary.map((achievement, achievementIndex) => (
                  <li key={achievementIndex}>{achievement}</li>
                ))}
              </ul> */}
            </div>
          );
        })}
      </div>
      <button onClick={handleDownloadPDF} style={{ marginTop: "20px" }}>
        Download as PDF
      </button>
    </div>
  );
};

export default Resume;

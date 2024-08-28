import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [rfpText, setRfpText] = useState("");
  const [tableOfContents, setTableOfContents] = useState([]);
  const [detailedSections, setDetailedSections] = useState("");

  const categorizeRFP = async () => {
    if (!rfpText.trim()) return;

    // Send the RFP text to the server to categorize it
    const response = await fetch("/api/generate?endpoint=categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rfpText }),
    });

    const data = await response.json();
    const fullText = data.categorizedRFP;

    // Extract headings (assuming headings are prefixed with ###)
    const headings = fullText.match(/^###\s.+/gm); // Regex to match headings starting with ###

    // Create an array of TOC items with heading text and corresponding IDs
    const tocItems = headings
      ? headings.map((heading, index) => {
          const id = `section-${index}`;
          return { text: heading.replace(/^###\s/, ""), id };
        })
      : [];

    // Replace headings in the full text with headings that have corresponding IDs
    let detailedTextWithAnchors = fullText;
    tocItems.forEach((item, index) => {
      detailedTextWithAnchors = detailedTextWithAnchors.replace(
        headings[index],
        `<h3 id="${item.id}">${headings[index].replace(/^###\s/, "")}</h3>`
      );
    });

    setTableOfContents(tocItems);
    setDetailedSections(detailedTextWithAnchors);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    categorizeRFP();
  };

  return (
    <div>
      <Head>
        <title>RFP Categorization Tool</title>
      </Head>
      <h1 className={styles.heading1}>RFP Categorization Tool</h1>
      <form onSubmit={onSubmit}>
        <div className={styles.inputContainer}>
          <textarea
            className={styles.textarea}
            name="rfpText"
            placeholder="Paste your RFP text here..."
            required
            value={rfpText}
            onChange={(e) => setRfpText(e.target.value)}
          ></textarea>
        </div>
        <div className={styles.buttonGroup}>
          <input
            className={styles.inputSubmit}
            type="submit"
            value="Categorize RFP"
          />
        </div>
      </form>
      <div className={styles.resultContainer}>
        <div className={styles.detailedSectionsContainer}>
          <h2>Detailed Sections</h2>
          <div
            className={styles.detailedSections}
            dangerouslySetInnerHTML={{ __html: detailedSections }}
          />
        </div>
        <div className={styles.tocContainer}>
          <h2>Table of Contents</h2>
          <ul>
            {tableOfContents.map((item, index) => (
              <li key={index}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

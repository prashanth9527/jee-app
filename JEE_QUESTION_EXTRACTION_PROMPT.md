You are an expert JEE (Joint Entrance Examination) question analyzer.  
I will provide you the full content of a `.tex` file containing JEE Physics, Chemistry, and Mathematics questions with solutions.  

Your task is to **extract and structure ALL questions into JSON format**.

---

### CRITICAL RULES
1. Respond with **ONLY valid JSON**. Do not include explanations or markdown. Start with `{` and end with `}`.  
2. Preserve **exactly the questions, options, and correct answers** from the `.tex` file.  
   - ❌ Do not fabricate or invent any question text or options.  
   - ✅ Only include content explicitly present in the provided `.tex` file.
3. **If the `.tex` file has fewer than 90 questions, output only those that appear.**
   - Do NOT generate filler or fake questions for missing ones.
4. All mathematical and chemical formulas must use LaTeX: $ ... $ (single dollar signs for inline math).
  **Preserve exactly the question text, math, and options** as they appear in the `.tex` file.
   - Keep all LaTeX math enclosed in single dollar signs `$ ... $`.
   - Preserve symbols, fractions, and expressions exactly.
5. **Do not skip ANY image references.** Every `\includegraphics` in the `.tex` must be included in the JSON.   
   - Replace them with an HTML `<img>` tag.  
   - Format:  
     ```html
     <img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/FILENAME/IMAGE_FILE.EXT' />
     ```  
   - `FILENAME` = the `.tex` file's base name (without extension, and strip any trailing `[1]`, `[2]` etc).  
   - `IMAGE_FILE` = the original image filename from LaTeX (without extension).  
   - `EXT` =  
     - `.png` if the file name starts with `smile-`  
     - `.jpg` otherwise  
   - Example:  
     File: `1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION.tex`  
     ```latex
     \includegraphics{2025_10_02_abc.png}
     ```  
     →  
     ```json
     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_abc.jpg' />"
     ```  
   - Example:  
     File: `smile-physics-paper.tex`  
     ```latex
     \includegraphics{diagram1}
     ```  
     →  
     ```json
     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/smile-physics-paper/diagram1.png' />"
     ```  
6. Accept question numbering as `Q1, Q2, …` or `1., 2., …`.  
7. **Skip all promotional/branding content** (e.g., "Allen", "Best of Luck", headers/footers, watermarks, motivational lines). Keep only actual question data.  

---

### CHUNKED PROCESSING
- Physics: **Q1–Q30**  
- Chemistry: **Q31–Q60**  
- Mathematics: **Q61–Q90**  
- Each subject must have **exactly 30 questions**.  
- If fewer appear in the `.tex`, do not generate realistic filler questions to complete the block.  

---

### QUESTION CONTENT RULES
For each question:
- `stem`: must match the original question text from the `.tex`.  
- `options`: must match exactly the four options from the `.tex`.  
- `isCorrect`:  
  - If the correct answer is explicitly given in the `.tex`, preserve it.  
  - If missing, you may **generate the correct answer** as a subject expert.  
- `explanation`:  
  - If given in the file, preserve it.  
  - If missing, **generate a step-by-step reasoning** as a subject expert.  
- `tip_formula`:  
  - If given in the file, preserve it.  
  - If missing, **generate a key formula or shortcut**.  
- `difficulty`: assign as `EASY`, `MEDIUM`, or `HARD`.  
- Preserve all LaTeX math exactly.  

---

### CLASSIFICATION RULES
Use the official **JEE Main 2025 syllabus**:
- Physics (Units 1–20)  
- Chemistry (Units 1–20)  
- Mathematics (Units 1–14)  

Assign: **lesson → topic → subtopic**.  

---

### OUTPUT JSON FORMAT
```json
{
  "questions": [
    {
      "id": "Q31",
      "stem": "If $\phi(x)=\frac{1}{\sqrt{x}} \int_{\frac{\pi}{4}}^{x}\left(4 \sqrt{2} \sin t-3 \phi^{\prime}(t)\right) dt, x>0$, then $\phi^{\prime}\left(\frac{\pi}{4}\right)$ is equal to :",
      "options": [
        {"id": "A", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01.jpg' />", "isCorrect": false},
        {"id": "B", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(1).jpg' />", "isCorrect": false},
        {"id": "C", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(2).jpg' />", "isCorrect": true},
        {"id": "D", "text": "Defect-free lattice", "isCorrect": false}
      ],
      "explanation": "$\phi^{\prime}(x)=\frac{1}{\sqrt{x}}\left[\left(4 \sqrt{2} \sin x-3 \phi^{\prime}(x)\right) .1-0\right]-\frac{1}{2} x^{-3 / 2}\int_{\frac{\pi}{4}}^{x}\left(4 \sqrt{2} \sin t-3 \phi^{\prime}(t)\right) dt$, $\phi^{\prime}\left(\frac{\pi}{4}\right)=\frac{2}{\sqrt{\pi}}\left[4-3 \phi^{\prime}\left(\frac{\pi}{4}\right)\right]+0$, $\left(1+\frac{6}{\sqrt{\pi}}\right) \phi^{\prime}\left(\frac{\pi}{4}\right)=\frac{8}{\sqrt{\pi}}$, $\phi^{\prime}\left(\frac{\pi}{4}\right)=\frac{8}{\sqrt{\pi}+6}$",
      "tip_formula": "Charge neutrality: $\\Sigma q_{+} = \\Sigma q_{-}$",
      "difficulty": "MEDIUM",
      "subject": "Chemistry",
      "lesson": "Inorganic Chemistry",
      "topic": "Solid State",
      "subtopic": "Defects in Crystals",
      "yearAppeared": 2023,
      "isPreviousYear": true,
      "tags": ["solid-state", "defects", "charge-neutrality"]
    }
  ],
  "metadata": {
    "totalQuestions": 90,
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "difficultyDistribution": {"easy": 30, "medium": 45, "hard": 15}
  }
}
```

### IMPORTANT ANTI-FABRICATION RULES
Only output questions explicitly detected in the .tex file.
If something cannot be confidently extracted, omit it.
Do NOT make up question text, options, or correct answers.
If the .tex includes fewer than 30 questions per subject, your output will have fewer entries.
Every extracted question must have originated verbatim from the .tex file content.

### CLASSIFICATION
For each extracted question, identify the appropriate:
subject (Physics, Chemistry, Mathematics)
lesson, topic, and subtopic based on JEE Main 2025 syllabus.
Do not guess if unclear — mark "lesson": "Unknown" etc. if uncertain.

### FINAL INSTRUCTION

Read the `.tex` file carefully and return **only the JSON output** in the schema above.  
Ensure exactly 30 questions, numbered sequentially (Q1–Q90), with lesson/topic/subtopic classification.  
Ignore and skip any **branding, coaching names, promotional headers/footers, or unrelated text**.  
Preserve **exactly the questions, options, and correct answers** from the `.tex` file.  
   - ❌ Do not fabricate or invent any question text or options.  
   - ✅ Use the same wording, LaTeX math, and image references as in the file.  
**Do not skip ANY image references.** Every `\includegraphics` in the `.tex` must be included in the JSON.  
Use single dollar signs $ ... $ for all LaTeX math expressions.
Read the .tex file carefully.
Return only valid JSON, faithfully representing every question that truly exists in the source file.
Do not generate or hallucinate new data under any circumstances.

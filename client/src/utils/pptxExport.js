import pptxgen from 'pptxgenjs';

export async function exportLessonPPTX(slides, title, authorName = 'TutorFlow') {
  const pres = new pptxgen();
  pres.title = title || 'Lesson';
  pres.author = authorName;

  pres.defineSlideMaster({
    title: 'MASTER_SLIDE',
    bkgd: '0f1117',
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: '10b981' } },
      { text: { text: "Generated via TutorFlow | Smart Lesson Copilot", options: { x: 0.5, y: 7.0, w: '100%', h: 0.3, color: '64748b', fontSize: 10, align: 'left', fontFace: 'Inter' } } }
    ]
  });

  slides.forEach((slide) => {
    const pptSlide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Slide Title
    pptSlide.addText(slide.title, {
      x: 0.5, y: 0.4, w: '90%', h: 0.8,
      fontSize: 28, bold: true, color: '10b981', fontFace: 'Inter'
    });

    if (slide.type === 'title') {
      pptSlide.addText(slide.subtitle || '', {
        x: 0.5, y: 2.5, w: '90%', h: 1.0,
        fontSize: 22, color: 'e2e8f0', fontFace: 'Inter', align: 'center'
      });
      pptSlide.addText(slide.tagline || '', {
        x: 0.5, y: 3.5, w: '90%', h: 0.5,
        fontSize: 16, color: '6366f1', fontFace: 'Inter', align: 'center', bold: true
      });
    } 
    else if (slide.type === 'content') {
      let yOffset = 1.3;
      if (slide.highlight) {
        pptSlide.addText(slide.highlight, {
          x: 0.5, y: yOffset, w: '90%', h: 0.6,
          fontSize: 16, color: '6366f1', fontFace: 'Inter', italic: true, fill: '1e293b'
        });
        yOffset += 0.8;
      }
      
      const bullets = (slide.bullets || []).map(b => ({ text: b, options: { bullet: true } }));
      if (bullets.length > 0) {
        pptSlide.addText(bullets, {
          x: 0.5, y: yOffset, w: '90%', h: 5.0,
          fontSize: 16, color: 'e2e8f0', fontFace: 'Inter', lineSpacing: 28, valign: 'top'
        });
      }
    }
    else if (slide.type === 'flowchart') {
      pptSlide.addText("Mermaid flowcharts render in the web app. (PPTX flowchart feature coming soon!)", {
        x: 0.5, y: 3.0, w: '90%', h: 1.0,
        fontSize: 16, color: '94a3b8', fontFace: 'Inter', align: 'center', italic: true
      });
      if (slide.caption) {
        pptSlide.addText(slide.caption, {
          x: 0.5, y: 6.0, w: '90%', h: 0.5,
          fontSize: 14, color: '94a3b8', fontFace: 'Inter', align: 'center'
        });
      }
    }
    else if (slide.type === 'diagram') {
      if (slide.imageUrl && !slide.imageUrl.endsWith('.svg')) {
        pptSlide.addImage({
          path: slide.imageUrl,
          x: 1.0, y: 1.3, w: 8.0, h: 4.8, sizing: { type: 'contain' }
        });
      } else {
        pptSlide.addText("Image preview available in the web app.", {
          x: 0.5, y: 3.0, w: '90%', h: 1.0,
          fontSize: 16, color: '94a3b8', fontFace: 'Inter', align: 'center', italic: true
        });
      }
      if (slide.caption) {
        pptSlide.addText(slide.caption, {
          x: 0.5, y: 6.2, w: '90%', h: 0.5,
          fontSize: 14, color: '94a3b8', fontFace: 'Inter', align: 'center', italic: true
        });
      }
    }
    else if (slide.type === 'quiz') {
      let yPos = 1.5;
      (slide.questions || []).slice(0, 2).forEach((q, i) => {
        pptSlide.addText(`Q${i+1}. ${q.question}`, {
          x: 0.5, y: yPos, w: '90%', h: 0.5,
          fontSize: 16, bold: true, color: 'e2e8f0', fontFace: 'Inter'
        });
        yPos += 0.6;
        const options = (q.options || []).map((opt, idx) => `${String.fromCharCode(65+idx)}. ${opt}`).join("   |   ");
        pptSlide.addText(options, {
          x: 0.5, y: yPos, w: '90%', h: 0.5,
          fontSize: 14, color: '94a3b8', fontFace: 'Inter'
        });
        yPos += 1.0;
      });
    }
    else if (slide.type === 'summary') {
      const points = (slide.keyPoints || []).map(b => ({ text: b, options: { bullet: true } }));
      if (points.length > 0) {
        pptSlide.addText(points, {
          x: 0.5, y: 1.5, w: '90%', h: 3.5,
          fontSize: 16, color: 'e2e8f0', fontFace: 'Inter', lineSpacing: 28, valign: 'top'
        });
      }
      if (slide.examTip) {
        pptSlide.addText(`🎯 Exam Tip: ${slide.examTip}`, {
          x: 0.5, y: 5.5, w: '90%', h: 1.0,
          fontSize: 16, color: 'eab308', bold: true, fontFace: 'Inter', fill: '1e293b'
        });
      }
    }
  });

  const safeTitle = title ? title.replace(/[^a-z0-9]/gi, '_') : 'Lesson';
  await pres.writeFile({ fileName: `${safeTitle}.pptx` });
}

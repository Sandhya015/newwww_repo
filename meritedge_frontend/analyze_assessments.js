// Script to analyze API response and find assessments without assessment_type "Cognitive"
const fs = require('fs');

// The JSON response provided by the user
const jsonResponse = `{ "assessments": [ { "company_id": "comp_aa2b6cac-43d7-4d4a-afaf-3eaef556d3b3", "target_experience": "4-6", "created_at": "2025-11-19T12:34:21.951677+00:00", "organization_id": "org_724a9bdb-84c0-4b39-9361-0f84b27b0864", "status": "draft", "total_score": "4", "difficulty_level": "intermediate", "created_by_email": "mayank.s@otomeyt.ai", "skills_required": [ "Java" ], "updated_at": "2025-11-21T05:24:54.963605+00:00", "title_lower": "java dev", "target_role": "dev", "question_count": "4", "section_count": "2", "assessment_type": "Cognitive", "unique_id": "assessment_b3cd36cd-65a6-46ff-aa75-fe9d869d1f7e", "title": "java dev" } ] }`;

try {
  // Parse the JSON (note: the provided JSON appears to be truncated)
  // For a complete analysis, we'd need the full JSON
  const data = JSON.parse(jsonResponse);
  
  const nonCognitiveAssessments = [];
  const cognitiveAssessments = [];
  
  if (data.assessments && Array.isArray(data.assessments)) {
    data.assessments.forEach((assessment, index) => {
      if (assessment.assessment_type !== "Cognitive") {
        nonCognitiveAssessments.push({
          index: index + 1,
          unique_id: assessment.unique_id,
          title: assessment.title,
          assessment_type: assessment.assessment_type || "MISSING",
        });
      } else {
        cognitiveAssessments.push({
          unique_id: assessment.unique_id,
          title: assessment.title,
        });
      }
    });
  }
  
  console.log("=== ANALYSIS RESULTS ===");
  console.log(`Total assessments found: ${data.assessments?.length || 0}`);
  console.log(`Cognitive assessments: ${cognitiveAssessments.length}`);
  console.log(`Non-Cognitive assessments: ${nonCognitiveAssessments.length}`);
  
  if (nonCognitiveAssessments.length > 0) {
    console.log("\n=== NON-COGNITIVE ASSESSMENTS ===");
    nonCognitiveAssessments.forEach(assessment => {
      console.log(`\nAssessment #${assessment.index}:`);
      console.log(`  Unique ID: ${assessment.unique_id}`);
      console.log(`  Title: ${assessment.title}`);
      console.log(`  Assessment Type: ${assessment.assessment_type}`);
    });
  } else {
    console.log("\n✅ All assessments in the response have assessment_type = 'Cognitive'");
  }
  
} catch (error) {
  console.error("Error parsing JSON:", error.message);
  console.log("\nNote: The provided JSON appears to be truncated or incomplete.");
  console.log("Please provide the complete JSON response for accurate analysis.");
}


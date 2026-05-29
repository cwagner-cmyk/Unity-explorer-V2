import { useState, useRef } from "react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const T = {
  dark:"#084153", navy:"#022633", aqua:"#52C2CF", lightAqua:"#C1E9F2",
  sky:"#E1F9FF", beige:"#F7F1EA", orange:"#F45B3D", mango:"#FFB545",
  softBlack:"#171717", gray:"#F2F2F2", textMuted:"#6B7B82", border:"#E0ECF0",
  white:"#FFFFFF",
};

const LEGAL_TEXT = "This guide is for educational purposes only and is designed to help explain your test report. It does not provide medical advice or replace conversations with your healthcare provider. Decisions about testing or care should be made in consultation with your healthcare provider or a genetic counselor. Results from this test should be interpreted in the context of your overall medical care.";

// ─── Carrier status config ────────────────────────────────────────────────────
const STATUS_CFG = {
  positive:       { label:"Positive",         color:T.orange,   bg:"#FFF0ED" },
  negative:       { label:"Negative",         color:"#1E7A38",  bg:"#F0FAF3" },
  increased_risk: { label:"Increased Risk",   color:"#A05500",  bg:"#FFF7ED" },
  high_risk:      { label:"High Risk",        color:T.orange,   bg:"#FFF0ED" },
  low_risk:       { label:"Low Risk",         color:"#1E7A38",  bg:"#F0FAF3" },
  not_applicable: { label:"N/A",              color:T.textMuted,bg:T.gray    },
  not_performed:  { label:"Not Performed",    color:T.textMuted,bg:T.gray    },
  no_call:        { label:"No Call",          color:"#7B5800",  bg:"#FFFBEB" },
  qc_fail:        { label:"QC Fail",          color:"#7B5800",  bg:"#FFFBEB" },
  snp_present:    { label:"SNP Present",      color:"#6B3A9E",  bg:"#F5F0FF" },
};

// ─── ANP status config ────────────────────────────────────────────────────────
const ANP_STATUS = {
  low_risk:     { label:"Low Risk",     color:"#1E7A38", bg:"#F0FAF3", icon:"✓" },
  high_risk:    { label:"HIGH RISK",    color:T.orange,  bg:"#FFF0ED", icon:"!" },
  no_call:      { label:"No Call",      color:"#7B5800", bg:"#FFFBEB", icon:"–" },
  qc_fail:      { label:"No Result",    color:"#7B5800", bg:"#FFFBEB", icon:"–" },
  not_ordered:  { label:"Not Ordered",  color:T.textMuted, bg:T.gray,  icon:"–" },
  detected:     { label:"DETECTED",     color:"#B86A00", bg:"#FFF8EC", icon:"·" },
  not_detected: { label:"Not Detected", color:"#1E7A38", bg:"#F0FAF3", icon:"✓" },
};

// ─── Static carrier explanations ─────────────────────────────────────────────
const STATIC_EXPLANATIONS = {
  // ── Utility / system keys ──────────────────────────────────────────────────
  __NO_CALL__: {
    summary: "Accurate results could not be obtained at this time. Please see your report for details.",
    sections: [], stats: [], action: null,
  },

  // ── Shared profile codes (gene-agnostic) ───────────────────────────────────
  "NEG": {
    summary: "Your test did not detect a disease-causing variant in this gene.",
    sections: [
      { label:"What this means", body:"A negative result significantly reduces the probability of being a carrier, but does not eliminate the risk entirely. Carrier screening cannot identify all possible variants in the genes analyzed, and does not evaluate for all genetic conditions.", video_id:"1195680903" },
      { label:"Your family history", body:"If you have a personal or family history of a genetic disorder, comprehensive genetic counseling is recommended so that carrier risks can be accurately discussed along with potential reproductive risks and additional testing options." },
    ],
    stats: [], action: null,
  },
  "NOT_ORDERED": {
    summary: "This was not ordered as part of your test panel.",
    sections: [
      { label:"Why this may appear", body:"Some conditions on the Unity panel are only included for certain patients based on clinical criteria or panel selection. This condition was not included in your order. If you have questions about which tests were ordered, please contact your healthcare provider." },
    ],
    stats: [], action: null,
  },
  "QC_FAIL_REDRAW": {
    summary: "Your sample did not meet the quality control requirements needed to report an accurate result. A new blood draw has been requested.",
    sections: [
      { label:"What happens next", body:"This is a technical issue with the sample — not a result about your health or a pregnancy's health. A redraw has been requested. Once a new sample is received and processed, a result will be reported." },
      { label:"Common reasons for QC failure", body:"Poor sample quality, insufficient DNA extraction, or other technical factors can cause a QC failure. This happens occasionally and typically does not indicate a problem." },
    ],
    stats: [], action: { label:"Contact Unity support", type:"genetic_counseling" },
  },
  "QC_FAIL_FINAL": {
    summary: "Your sample did not meet quality control requirements needed to report an accurate result. A final QC Fail has been issued.",
    sections: [
      { label:"What this means", body:"The laboratory was unable to obtain an accurate reportable result. This can occasionally occur due to biological factors in the sample. A result for this condition will not be available and a redraw is not requested." },
      { label:"Next steps", body:"Please speak with your healthcare provider or a genetic counselor to discuss alternative testing options if clinically indicated." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "NO_CALL_INELIGIBLE_REDRAW": {
    summary: "Accurate results could not be obtained at this time. A new blood draw has been requested.",
    sections: [
      { label:"What this means", body:"Occasionally, a sample cannot produce an accurate result due to technical reasons. This is not a result about your genetic status. A redraw is requested." },
    ],
    stats: [], action: { label:"Contact Unity support", type:"genetic_counseling" },
  },
  "NO_CALL_INELIGIBLE_FINAL": {
    summary: "Accurate results could not be obtained at this time.",
    sections: [
      { label:"What this means", body:"We were unable to produce an accurate result from this sample. This is often due to technical reasons, not due to your health or a pregnancy's health. Please speak with your healthcare provider about next steps." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "POSITIVE": {
    summary: "You are a carrier for this condition. Carriers typically have no symptoms and are generally in good health.",
    sections: [
      { label:"What being a carrier means", body:"Being a carrier usually does not affect your own health and carriers typically have no symptoms. However, if your reproductive partner is also a carrier for the same condition, there is a chance that a pregnancy could be affected." },
      { label:"Your future pregnancies", body:"If your partner is also a carrier, each pregnancy has a 25% (1 in 4) chance to be affected with the condition, a 50% (1 in 2) chance to be a carrier like you, and a 25% (1 in 4) chance to be unaffected with no variants. A cfDNA fetal risk assessment may have been performed to further evaluate the fetal risk — see your report for details." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a carrier. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"25%", label:"Fetal risk if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "POS_AFFECTED": {
    summary: "Two disease-causing variants were identified in this gene. This means you may be affected with the associated condition. Additional medical evaluation is recommended.",
    sections: [
      { label:"What this means", body:"Most carrier screening tests look for a single variant (carrier). In your case, two variants were identified, which means you may have the condition yourself. Your healthcare provider can help determine whether clinical evaluation is appropriate." },
      { label:"Your future pregnancies", body:"If your reproductive partner is also a carrier, each future pregnancy has a 50% (1 in 2) chance to inherit both a maternal and paternal variant and be affected with the condition. Genetic counseling is recommended to discuss reproductive options." },
      { label:"Your family", body:"Your close relatives are at risk to be carriers. Your siblings are also at risk to be affected with this condition. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"50%", label:"Fetal risk if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "POS_COMPLEX": {
    summary: "See your full report for details about your results.",
    sections: [
      { label:"What this means", body:"The details of your specific result are in your report. Please contact Unity support or your healthcare provider to discuss your result if you have additional questions." },
    ],
    stats: [], action: { label:"Contact Unity support", type:"genetic_counseling" },
  },

  // ── Alpha-Thalassemia (HBA1/HBA2) ─────────────────────────────────────────
  "ALPHA_THALASSEMIA__ATHAL_SILENT_aa/a-": {
    summary: "You have three working copies of the alpha-globin genes and carry one non-working copy. This means you are a silent carrier of alpha-thalassemia, but your own health is typically not affected.",
    sections: [
      { label:"What this means", body:"Alpha-thalassemia is caused by deletions in the alpha-globin genes. A 'silent carrier' has one gene deletion (out of four total alpha-globin genes). Silent carriers are healthy and typically have no symptoms, and their blood counts are usually normal.", video_id:"1192276879" },
      { label:"Your future pregnancies", body:"If your partner carries multiple deletions in the alpha-globin genes, there is a chance the fetus could inherit a less severe form of alpha-thalassemia called Hemoglobin H disease. The fetal risk depends on the specific type of deletion your partner carries. cfDNA fetal risk assessment may provide more information — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a silent carrier. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ALPHA_THALASSEMIA__ATHAL_SILENTNONDELETION_aa/a*": {
    summary: "You carry a variant in your alpha-globin genes. This means you are a carrier of alpha-thalassemia, but your own health is typically not affected.",
    sections: [
      { label:"What this means", body:"A variant was found in one of your alpha-globin genes. Like most other alpha-thalassemia carriers, you are usually healthy with no symptoms." },
      { label:"Your future pregnancies", body:"Understanding the fetal risk for a combination of your variant and a reproductive partner's variant can be complex. The fetal risk for alpha-thalassemia depends on the specific type of carrier your partner is. cfDNA fetal risk assessment may provide more information — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ALPHA_THALASSEMIA__ATHAL_TRAIT_a-/a-": {
    summary: "You have two working copies of the alpha-globin genes and two non-working copies. Your working copies are on different chromosomes (trans orientation). Some people with this finding may have mild anemia but are typically otherwise healthy.",
    sections: [
      { label:"What this means", body:"Alpha-thalassemia trait, or being a carrier in trans, can cause mild anemia with small red blood cells. However, most people with this finding are healthy.", video_id:"1192276879" },
      { label:"Your future pregnancies", body:"If your partner also has alpha-thalassemia trait with deletions in cis (both deletions on the same chromosome), there is a 25% chance the fetus could have Hemoglobin H disease, a milder form of alpha-thalassemia. cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to carry at least one alpha-globin deletion. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"up to 25%", label:"Fetal risk for Hemoglobin H disease depending on partner's carrier status" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ALPHA_THALASSEMIA__ATHAL_TRAIT_aa/--": {
    summary: "You carry two working copies of the alpha-globin genes on the same chromosome, and two non-working copies on the other (cis orientation). Some people may have mild anemia but are typically otherwise healthy.",
    sections: [
      { label:"What this means", body:"Having two alpha-globin deletions on the same chromosome (cis, such as SEA, FIL/THAI, or MED) is referred to as alpha-thalassemia trait. This can cause mild anemia with small red blood cells. However, most people with this finding are healthy." },
      { label:"Your future pregnancies", body:"If your partner is also a carrier of alpha-thalassemia, there is a chance to have a baby with Hemoglobin Bart's disease (severe) or Hemoglobin H disease (less severe). cfDNA fetal risk assessment may have been performed — see your report for fetal risk results." },
      { label:"Your family", body:"Your first-degree relatives are at risk for alpha-thalassemia trait or being a silent carrier. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for alpha-thalassemia depending on partner's carrier status" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ALPHA_THALASSEMIA__ATHAL_TRAIT_HS40DEL": {
    summary: "You carry a variant in the alpha-globin genes. This means you are a carrier of alpha-thalassemia, but your own health is typically not affected.",
    sections: [
      { label:"What this means", body:"Carriers of this variant may have mild anemia with small blood cells. However, most people with this finding are healthy." },
      { label:"Your future pregnancies", body:"The fetal risk for alpha-thalassemia depends on your partner's alpha-globin status. cfDNA fetal risk assessment may provide more information — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ALPHA_THALASSEMIA__ATHAL_HBH": {
    summary: "Your carrier results indicate you may have Hemoglobin H (HbH) disease. This is a milder form of alpha-thalassemia that can cause moderate to severe anemia. Medical evaluation is recommended.",
    sections: [
      { label:"What this means", body:"Hemoglobin H disease occurs when three of the four alpha-globin genes are non-working. This typically results from a deletion in cis (like SEA) on one chromosome and a single deletion on the other. HbH disease causes moderate anemia and may require monitoring or treatment." },
      { label:"Your health", body:"People with HbH disease can live normal lives, but some may need medical management, particularly during illness or pregnancy. An evaluation by a hematologist may be recommended." },
      { label:"Risk to your pregnancy", body:"If your partner carries alpha-globin deletions as well, there may be a risk for a more severe condition in the fetus. Genetic counseling is recommended to discuss the fetal risk and options such as prenatal diagnosis." },
      { label:"Your family", body:"Your siblings and other first-degree relatives may be at risk for alpha-thalassemia trait or HbH disease. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"up to 50%", label:"Fetal risk for alpha-thalassemia depending on partner's carrier status" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Cystic Fibrosis (CFTR) ─────────────────────────────────────────────────
  "CYSTIC_FIBROSIS__POSITIVE": {
    summary: "You are a carrier of cystic fibrosis (CF). Carriers are usually healthy and do not have symptoms of CF.",
    sections: [
      { label:"What being a CF carrier means", body:"A disease-causing CFTR variant was detected in your sample. Being a carrier usually does not affect your own health." },
      { label:"Your future pregnancies", body:"If your partner is also a CF carrier, each pregnancy has a 25% (1 in 4) chance to have CF, a 50% (1 in 2) chance to be a carrier, and a 25% (1 in 4) chance to inherit neither variant. A cfDNA fetal risk assessment may have been performed — see your report for fetal risk details." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a CF carrier. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for CF if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "CYSTIC_FIBROSIS__POSITIVE_R117H": {
    summary: "You carry a specific variant called R117H in the CFTR gene. This means you are a carrier of cystic fibrosis. Carriers are usually healthy and do not have symptoms of CF.",
    sections: [
      { label:"About the R117H variant", body:"R117H is a CFTR variant that can present differently depending on whether or not it is inherited with nearby genetic changes called the 5T/7T/9T poly-T tract. Expression of symptoms can vary between men and women who carry the R117H variant and depends on the combination of CFTR variants a person has." },
      { label:"Your future pregnancies", body:"If your partner is also a CFTR carrier, the risk for symptoms in a baby depends on the specific combination of variants inherited. A cfDNA fetal risk assessment may have been performed — see your report for fetal risk details." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "CYSTIC_FIBROSIS__POS_AFFECTED": {
    summary: "Two CFTR variants were detected in your sample. This means you may be affected with cystic fibrosis or a related condition. Medical evaluation is recommended.",
    sections: [
      { label:"What this means", body:"Two disease-causing variants were identified in the CFTR gene. This means you may be affected with cystic fibrosis, though the severity of symptoms can vary depending on the specific combination of variants. A clinical evaluation is recommended." },
      { label:"Your future pregnancies", body:"Prior to a future pregnancy, carrier screening for CF for your reproductive partner can be considered to clarify the risks for an affected child. If your partner is also a carrier, each pregnancy has a 50% chance to inherit both a maternal and paternal CFTR variant and be affected." },
      { label:"Your family", body:"Your close relatives are at risk to be CF carriers. Your siblings are also at increased risk to be affected. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"up to 50%", label:"Fetal risk for CF if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Sickle Cell / Beta-Thal / Hemoglobinopathies (HBB) ────────────────────
  "SICKLE_CELL__POSITIVE_HBS": {
    summary: "You are a carrier of sickle cell disease (also called HbS or sickle cell trait). Carriers are usually healthy and have no symptoms.",
    sections: [
      { label:"What sickle cell trait means", body:"You carry one copy of the sickle cell variant (HbS). People with sickle cell trait are generally healthy. In rare cases, extreme physical conditions may trigger symptoms, but most carriers live full, healthy lives." },
      { label:"Your future pregnancies", body:"If your partner is also a carrier for a hemoglobin condition, each pregnancy may be at risk for sickle cell disease or a related condition. A cfDNA fetal risk assessment may have been performed — see your report for fetal risk details." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also have sickle cell trait. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for sickle cell disease if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POSITIVE_HBC": {
    summary: "You are a carrier of hemoglobin C (also called HbC trait). Carriers are usually healthy and do not have symptoms.",
    sections: [
      { label:"What HbC trait means", body:"You carry one copy of the HbC variant. People with HbC trait are healthy and typically have no symptoms." },
      { label:"Your future pregnancies", body:"If your partner is also a carrier for a hemoglobin condition (such as sickle cell trait or beta-thalassemia), each pregnancy can have a risk to be affected with a hemoglobin condition. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POSITIVE_HBE": {
    summary: "You are a carrier of hemoglobin E (also called HbE trait). Carriers are usually healthy and do not have symptoms.",
    sections: [
      { label:"What HbE trait means", body:"You carry one copy of the HbE variant. People with HbE trait are healthy and typically have no symptoms." },
      { label:"Your future pregnancies", body:"If your partner is also a carrier for a hemoglobin variant (such as sickle cell trait or beta-thalassemia), each pregnancy can have a risk to be affected with a hemoglobin condition. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POSITIVE_BTHAL": {
    summary: "You are a carrier of beta-thalassemia. Carriers may have mildly small red blood cells but are otherwise healthy.",
    sections: [
      { label:"What beta-thalassemia carrier means", body:"You carry one variant in the HBB gene associated with beta-thalassemia. Carriers may have slightly smaller red blood cells (microcytosis) and mild anemia, but this does not significantly affect your health typically." },
      { label:"Your future pregnancies", body:"If your partner is also a beta-thalassemia carrier, each pregnancy has a 25% chance to have beta-thalassemia. The type and severity depends on the specific genetic variants. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a beta-thalassemia carrier. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POSITIVE_BHEMOPATHY": {
    summary: "You carry a variant in the HBB gene associated with a beta-hemoglobinopathy. Carriers are typically healthy.",
    sections: [
      { label:"What this means", body:"A pathogenic variant in the HBB gene was identified that is associated with a beta-hemoglobinopathy condition. Carriers typically have no symptoms." },
      { label:"Your future pregnancies", body:"If your partner also carries an HBB variant, the fetal risk depends on the specific combination. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also carry this variant. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POS_AFFECTED_HBSS": {
    summary: "Two copies of the sickle cell variant (HbSS) were identified in your sample. This means you may be affected with sickle cell disease. Medical evaluation is strongly recommended.",
    sections: [
      { label:"What this means", body:"Having two copies of the HbS variant (HbSS) is associated with sickle cell disease. If you have not already been evaluated by a hematologist, a clinical evaluation is recommended. Symptoms can vary in severity." },
      { label:"Your future pregnancies", body:"If your reproductive partner is also a carrier for a hemoglobin condition, each future pregnancy has a 50% (1 in 2) chance to be affected. Carrier screening for your reproductive partner is recommended. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your close relatives are at risk to be sickle cell trait carriers. Your siblings may also be affected. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"50%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POS_AFFECTED_HBSC": {
    summary: "You carry both the HbS and HbC variants in the HBB gene. This means you may be affected with hemoglobin SC disease. Medical evaluation is recommended.",
    sections: [
      { label:"What this means", body:"Hemoglobin SC disease is caused by having one sickle cell variant (HbS) and one HbC variant. It is a form of sickle cell disease that is generally milder than HbSS but can still cause health complications, including pain crises and eye complications." },
      { label:"Your future pregnancies", body:"If your reproductive partner is also a carrier for a hemoglobin variant, each future pregnancy has a 50% (1 in 2) chance to be affected. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your close relatives may be at risk to carry HbS or HbC. Your siblings may also be affected. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"50%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SICKLE_CELL__POS_AFFECTED_HBSBTHAL": {
    summary: "You carry both the HbS variant and a beta-thalassemia variant in the HBB gene. This means you may be affected with sickle beta-thalassemia. Medical evaluation is recommended.",
    sections: [
      { label:"What this means", body:"Sickle beta-thalassemia is caused by having one copy of the sickle cell variant (HbS) and one copy of a beta-thalassemia variant. Severity varies depending on the specific beta-thalassemia variant but can include symptoms similar to sickle cell disease." },
      { label:"Your future pregnancies", body:"If your reproductive partner is also a carrier for a hemoglobin variant, each future pregnancy has a 50% (1 in 2) chance to be affected. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your close relatives may be at risk to be carriers for sickle cell trait or beta-thalassemia. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"50%", label:"Fetal risk for hemoglobin disorders if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Spinal Muscular Atrophy (SMN1) ─────────────────────────────────────────
  "SMN_1CN_CARRIER": {
    summary: "You are a carrier for spinal muscular atrophy (SMA). You have one working copy of the SMN1 gene and one non-working copy. Carriers are healthy and do not have symptoms of SMA.",
    sections: [
      { label:"What being an SMA carrier means", body:"A non-working copy of the SMN1 gene was detected in your sample. This means you are a carrier of SMA. Carriers are typically healthy and have no symptoms." },
      { label:"Your future pregnancies", body:"If your partner is also an SMA carrier, each pregnancy has a 25% (1 in 4) chance to have SMA. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be an SMA carrier. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"25%", label:"Fetal risk for SMA if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "SMN_SILENT_CARRIER": {
    summary: "You have 2 working copies of the SMN1 gene along with a specific genetic marker (SNP). Most people with this finding are not SMA carriers, but the risk depends on your ethnic background.",
    sections: [
      { label:"What this means", body:"This result does NOT confirm that you are a carrier of SMA. However, the presence of the rs143838139 SNP means your risk of being a 'silent carrier' — someone who has 2 SMN1 copies on one chromosome and 0 on the other — may be slightly higher depending on your ethnicity.", video_id:"1156510845" },
      { label:"Why ethnicity matters", body:"People of Ashkenazi Jewish descent with this SNP are likely silent carriers of SMA. For all other backgrounds, the chance of being a silent carrier is low (approximately 1–3%)." },
      { label:"Next steps", body:"Carrier screening for SMA is recommended for your reproductive partner if you are of Ashkenazi Jewish descent, and can be considered for any ethnic background if you want more information about fetal risk." },
    ],
    stats: [],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
    ethnicity_table: [
      { ethnicity:"African American",  pretest:"1 in 72", posttest:"1 in 39"        },
      { ethnicity:"Ashkenazi Jewish",  pretest:"1 in 67", posttest:"Likely Carrier"  },
      { ethnicity:"Asian",             pretest:"1 in 59", posttest:"1 in 61"         },
      { ethnicity:"Northern European", pretest:"1 in 47", posttest:"1 in 69"         },
      { ethnicity:"Hispanic",          pretest:"1 in 68", posttest:"1 in 99"         },
      { ethnicity:"General Population",pretest:"1 in 54", posttest:"Unknown"         },
    ],
  },
  "SMN_0CN_AFFECTED": {
    summary: "No working copies of the SMN1 gene were detected. This result indicates you may be affected with spinal muscular atrophy (SMA). Medical evaluation is strongly recommended.",
    sections: [
      { label:"What this means", body:"SMA is caused by the absence or loss of function of both copies of the SMN1 gene. Having 0 copies is consistent with a diagnosis of SMA. The severity of SMA varies depending on the specific genetic changes and modifier genes. Medical evaluation by a neurologist or neuromuscular disease specialist is recommended." },
      { label:"Your future pregnancies", body:"If your reproductive partner is also a carrier for SMA, each future pregnancy has a 50% (1 in 2) chance to be affected. Carrier screening for your reproductive partner is recommended. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your siblings are at increased risk to also be affected with SMA. Your parents are likely both carriers. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"50%", label:"Fetal risk for SMA if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Fragile X (FMR1) ───────────────────────────────────────────────────────
  "FRAGILE_X__NEG": {
    summary: "You have a normal number of repeats in the FMR1 region.",
    sections: [
      { label:"What this means", body:"Fragile X syndrome is caused by an expansion of CGG repeats in the FMR1 gene. Your CGG repeat count is below 45, which is within the normal range and significantly reduces the risk that your children will have fragile X syndrome." },
    ],
    stats: [], action: null,
  },
  "FRAGILE_X__NEG_INTERMEDIATE": {
    summary: "You have an intermediate number (45–54) of repeats in the FMR1 region. This does not increase your chance to have a child with Fragile X syndrome, but it does have some implications for future generations.",
    sections: [
      { label:"What an intermediate result means", body:"An intermediate allele (45–54 CGG repeats) is between the normal range and a premutation. Intermediate alleles do not cause fragile X syndrome in you or your children. However, in rare cases, they may expand to a premutation or full mutation over multiple generations." },
      { label:"Monitoring", body:"No specific medical management is needed for you. There is a small chance that over generations the repeat could expand, so this information may be relevant for your children and grandchildren." },
      { label:"Your family", body:"This result may be relevant to share with family members, particularly female relatives of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "FRAGILE_X__PREMUTATION_REFLEX_AGG": {
    summary: "You have a fragile X premutation (55–90 CGG repeats). This means you are a premutation carrier of fragile X syndrome. The risk of passing a full mutation to your children depends on the size of the expansion and other genetic factors.",
    sections: [
      { label:"What this means", body:"The chance that the premutation will expand to a full mutation in your children increases with the size of your repeat expansion. cfDNA analysis cannot directly determine fetal FMR1 repeat size, but additional genetic analysis and fetal sex determination may have been assessed to estimate the risk. See your report for fetal risk details." },
      { label:"AGG interruptions", body:"An additional genetic analysis called AGG interruption analysis may have been performed. This helps refine the chance that a premutation expands to a full mutation in a pregnancy. See your report for details on how your specific AGG interruption analysis impacts your chance to have a child with Fragile X syndrome." },
      { label:"What this means for you", body:"Premutation carriers are at increased risk for Fragile X-associated Tremor/Ataxia Syndrome (FXTAS), which can develop later in life, and for Fragile X-associated Primary Ovarian Insufficiency (FXPOI), which may affect fertility. Not everyone with a premutation develops these conditions." },
      { label:"Your family", body:"Your relatives are at risk to be premutation carriers as well. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "FRAGILE_X__PREMUTATION": {
    summary: "You have a fragile X premutation (91–200 CGG repeats). This means you are a premutation carrier. There is a risk of expansion to a full mutation that could be passed on to your children.",
    sections: [
      { label:"What this means", body:"There is a risk of expansion to a full mutation in this repeat size range (91–200). cfDNA analysis cannot directly determine fetal FMR1 repeat size, but fetal sex may have been assessed to estimate the risk. See your report for fetal risk details." },
      { label:"What this means for you", body:"Premutation carriers are at increased risk for Fragile X-associated Tremor/Ataxia Syndrome (FXTAS) and, for females, Fragile X-associated Primary Ovarian Insufficiency (FXPOI). Not everyone with a premutation develops these conditions." },
      { label:"Your family", body:"Your relatives are at risk to be premutation carriers as well. We recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "FRAGILE_X__FULL_MUTATION": {
    summary: "You have a fragile X full mutation (more than 200 CGG repeats). This means you may be affected with fragile X syndrome. Medical evaluation is suggested.",
    sections: [
      { label:"What this means", body:"There is a 50% chance to pass the full mutation onto a child. Male children with more than 200 repeats are affected with fragile X syndrome while females are typically less severely affected. cfDNA fetal sex assessment may have been performed to help estimate the fetal risk — see your report." },
      { label:"What this means for you", body:"A full mutation in the FMR1 gene can cause fragile X syndrome. In females, full mutations can have variable expression — some women are significantly affected, while others have milder or no symptoms. Medical evaluation is suggested." },
      { label:"Your family", body:"Your relatives are at risk to be premutation or full mutation carriers. We strongly recommend sharing these results with blood relatives, especially those of reproductive age." },
    ],
    stats: [{ val:"50%", label:"Fetal risk to inherit a full FMR1 mutation" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "FRAGILE_X__MOSAIC": {
    summary: "Your FMR1 test identified three repeat lengths instead of two. This may indicate mosaicism or a testing artifact. Additional evaluation may be considered.",
    sections: [
      { label:"What this means", body:"Usually, finding three different FMR1 repeat sizes is caused by the testing method itself and does not represent a true genetic finding. Less commonly, it may reflect true mosaicism (different cell populations with different repeat sizes) or an extra X chromosome. If all three repeat sizes are in the normal range, the chance for fragile X syndrome is not expected to be increased. In some cases, chromosome analysis may be considered." },
      { label:"Next steps", body:"Please speak with your healthcare provider or a genetic counselor to determine whether additional testing is appropriate for you." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Tay-Sachs Disease (HEXA) ───────────────────────────────────────────────
  "NEG_PSEUDO": {
    summary: "Your test identified a pseudodeficiency allele in the HEXA gene. This is NOT a disease-causing variant and does not mean you are a carrier of Tay-Sachs disease.",
    sections: [
      { label:"What a pseudodeficiency allele means", body:"Pseudodeficiency alleles can cause reduced HEXA enzyme activity in laboratory tests, but they do not cause Tay-Sachs disease and do not increase the risk for Tay-Sachs in your children. This is an incidental finding of no clinical significance for your Tay-Sachs risk." },
      { label:"Why it appears in your report", body:"This finding is documented in your report because it may affect certain HEXA enzyme-based screening tests. However, the DNA-based carrier screening performed by Unity Screen is not affected by this variant." },
    ],
    stats: [], action: null,
  },
  "TAY_SACHS__POSITIVE": {
    summary: "You are a carrier for Tay-Sachs disease. Carriers are usually healthy and do not have symptoms.",
    sections: [
      { label:"What being a carrier means", body:"A disease-causing HEXA variant was detected in your sample. Being a carrier usually does not affect your own health." },
      { label:"Your future pregnancies", body:"If your partner is also a Tay-Sachs carrier, each pregnancy has a 25% (1 in 4) chance to have Tay-Sachs disease. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a carrier. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Plus Panel (Canavan, DMD, PAH) ─────────────────────────────────────────
  "CANAVAN__POSITIVE": {
    summary: "You are a carrier for Canavan disease. Carriers are usually healthy and do not have symptoms of the condition.",
    sections: [
      { label:"What being a carrier means", body:"A disease-causing ASPA variant was detected in your sample. Being a carrier usually does not affect your own health." },
      { label:"Your future pregnancies", body:"If your partner is also a Canavan disease carrier, each pregnancy has a 25% (1 in 4) chance to have Canavan disease. The severity can vary depending on the specific variants inherited. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a carrier. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"25%", label:"Fetal risk if partner is also a carrier" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "DMD__POSITIVE": {
    summary: "You carry a variant in the DMD gene associated with DMD-associated dystrophinopathies. Being a carrier can have implications for your own health as well as your children's.",
    sections: [
      { label:"What being a DMD carrier means", body:"DMD-associated dystrophinopathies are caused by variants in the DMD gene on the X chromosome. Specific variants can cause classic, severe Duchenne muscular dystrophy (DMD) or milder presentations like Becker muscular dystrophy (BMD). Female carriers are usually healthy, though a small percentage may develop mild muscle weakness or cardiomyopathy. Cardiac screening is recommended for female DMD carriers." },
      { label:"Your future pregnancies", body:"Each pregnancy has a 50% chance to inherit the DMD variant. Male children who inherit the variant will typically be affected with Duchenne or Becker muscular dystrophy. Female children who inherit the variant will be carriers. A cfDNA fetal risk assessment using fetal sex may have been performed — see your report." },
      { label:"Your family", body:"Your female relatives are at risk to be carriers. Your male relatives may be at risk to be affected. We recommend sharing these results with blood relatives." },
    ],
    stats: [{ val:"50%", label:"Fetal risk to inherit the DMD variant" }],
    action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "PAH__POSITIVE_HYPERPHE": {
    summary: "You are a carrier for Phenylalanine Hydroxylase Deficiency (PKU/PAH deficiency). Carriers are usually healthy and do not have symptoms.",
    sections: [
      { label:"What being a carrier means", body:"A disease-causing PAH variant was detected in your sample. Some variants may be associated with a milder condition called hyperphenylalaninemia — see your report for details about your specific variant. Being a carrier usually does not affect your own health." },
      { label:"Your future pregnancies", body:"If your partner is also a PAH deficiency carrier, each pregnancy has a 25% (1 in 4) chance to have PAH deficiency. Newborns are screened for PKU at birth. A cfDNA fetal risk assessment may have been performed — see your report." },
      { label:"Your family", body:"Your first-degree relatives each have a 50% chance to also be a carrier. We recommend sharing these results with blood relatives." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },

  // ── Fetal Fraction ─────────────────────────────────────────────────────────
  "FETAL_FRACTION_EXPLANATION": {
    summary: "Fetal fraction is the amount of DNA from the pregnancy (placenta) that is present in a pregnant person's blood sample compared to their own DNA. Unity works by analyzing this pregnancy-related DNA to provide reliable results.",
    sections: [
      { label:"What is a 'good' fetal fraction?", body:"Fetal fraction varies across pregnancies. Rather than focusing on a single 'good' or 'bad' number, fetal fraction is one part of the overall quality assessment for the test. Unity technology is designed to work accurately across a wide range of fetal fractions, and we only release results when we are confident they are reliable." },
      { label:"What affects fetal fraction?", body:"Fetal fraction can be influenced by gestational age, body weight, medications, and other biological factors. A low fetal fraction does not indicate anything is wrong with the pregnancy." },
    ],
    stats: [], action: null,
  },
};

// ─── Video lookup map ─────────────────────────────────────────────────────────
// Keyed by BI profile code, exactly as it appears in the static content spreadsheet.
// videoId: Vimeo video ID extracted from the embed code.
// title: human-readable label shown on the thumbnail card.
// section: which section the video belongs to in the static content (1 or 2).
// When this tool is wired to the real API, this map will be populated from the
// BI pipeline response rather than hardcoded here.
const VIDEO_MAP = {
  // ── Carrier screen ──────────────────────────────────────────────────────────
  NEG:                        { videoId:"1195680903", title:"Negative Carrier Screen",           section:1 },
  ALPHA_THALASSEMIA__ATHAL_SILENT_aa_a_minus:
                              { videoId:"1192276879", title:"Alpha-Thalassemia Carriers",         section:1 },
  ALPHA_THALASSEMIA__ATHAL_TRAIT_a_minus_a_minus:
                              { videoId:"1192276879", title:"Alpha-Thalassemia Carriers",         section:1 },
  SMN_SILENT_CARRIER:         { videoId:"1156510845", title:"What Does an SMN1 SNP+ Result Mean?",section:1 },
  SMA_SNP:                    { videoId:"1156510845", title:"What Does an SMN1 SNP+ Result Mean?",section:1 }, // alias used by static_explanation_map

  // ── cfDNA fetal risk ────────────────────────────────────────────────────────
  lowrisk:                    { videoId:"1193369266", title:"Low Risk Fetus, Positive Carrier",  section:1 },

  // ── Aneuploidy NIPT ─────────────────────────────────────────────────────────
  ANP__LOW_RISK_SINGLETON:    { videoId:"1194749483", title:"Low Risk Aneuploidy Result",        section:1 },
  ANP__LOW_RISK_TWIN:         { videoId:"1194749483", title:"Low Risk Aneuploidy Result",        section:1 },
  ANP__LOW_RISK_TWIN__s2:     { videoId:"1194755920", title:"Understanding Zygosity",            section:2 },
  ANP__NO_CALL_REDRAW_SINGLETON:{ videoId:"1194749532", title:"No Call Result",                  section:1 },
  ANP__NO_CALL_REDRAW_TWIN:   { videoId:"1194749532", title:"No Call Result",                    section:1 },
  ANP__NO_CALL_FINAL_SINGLETON:{ videoId:"1194749532", title:"No Call Result",                   section:1 },
  ANP__NO_CALL_FINAL_TWIN:    { videoId:"1194749532", title:"No Call Result",                    section:1 },

  // ── 22q NIPT ────────────────────────────────────────────────────────────────
  "22Q_LOW_RISK":             { videoId:"1194744184", title:"Low Risk 22q11.2 Deletion",         section:1 },
  "22Q_FIRST_NO_CALL_REDRAW_REQUESTED": { videoId:"1194744184", title:"22q No Call Result",     section:1 },
  "22Q_SECOND_NO_CALL_FINAL": { videoId:"1194744184", title:"22q No Call Result",               section:1 },

  // ── RhD NIPT ────────────────────────────────────────────────────────────────
  RHD_DETECTED:               { videoId:"1172986590", title:"RhD Detected",                      section:1 },
  RHD_NOT_DETECTED:           { videoId:"1172988446", title:"RhD Not Detected",                  section:1 },
  RHD_NO_CALL_REDRAW_REQUESTED:{ videoId:"1194749532", title:"No Call Result",                   section:1 },
  RHD_NO_CALL_FINAL:          { videoId:"1194749532", title:"No Call Result",                    section:1 },

  // ── Fetal Antigen NIPT ──────────────────────────────────────────────────────
  FETAL_DETECTED:             { videoId:"1172979698", title:"Fetal Antigen Detected",             section:1 },
  NOT_DETECTED:               { videoId:"1172988446", title:"Fetal Antigen Not Detected",         section:1 },
};

// ─── ANP Static Content ───────────────────────────────────────────────────────
// All content sourced directly from unitystaticcontentreview_20260526.xlsx,
// ANP static content sheet. Keyed by BI Profile code.
// Each section may include video_id and video_title from the embed code column.
// When wired to the real API, this map will be populated from the BI pipeline response.
const ANP_STATIC_CONTENT = {
  "ANP__LOW_RISK_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, 21, X, and Y.",
    sections: [
      { label:"What this means", body:"A low risk NIPT result significantly reduces the risk for the screened aneuploidies; it does not eliminate the risk. This result does not guarantee a normal pregnancy outcome.", video_id:"1194749483", video_title:"Low Risk Aneuploidy" },
      { label:"What is NIPT?", body:"Non-invasive prenatal testing (NIPT) analyzes cell-free DNA from the placenta in the pregnant person's blood to assess the risk for certain chromosomal conditions." },
      { label:"Next steps", body:"Routine prenatal care is recommended. If you have questions about your result, please speak with your healthcare provider or a genetic counselor." },
    ],
    stats: [], action: null,
  },
  "ANP__LOW_RISK_TWIN": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, 21, X, and Y.",
    sections: [
      { label:"What this means", body:"A low risk NIPT result significantly reduces the risk for the screened aneuploidies in a twin pregnancy; it does not eliminate the risk. This result does not guarantee a normal pregnancy outcome.", video_id:"1194749483", video_title:"Low Risk Aneuploidy" },
      { label:"What is NIPT?", body:"NIPT for twin pregnancies analyzes cell-free DNA to assess the risk for chromosomal conditions. In some cases, zygosity testing may be performed for twin pregnancies. Note: sex chromosome aneuploidy screening is not performed for twin pregnancies.", video_id:"1194755920", video_title:"Understanding Zygosity" },
      { label:"Next steps", body:"Routine prenatal care is recommended. If you have questions about your result, please speak with your healthcare provider or a genetic counselor." },
    ],
    stats: [], action: null,
  },
  "ANP__LOW_RISK_SINGLETON_PARTIAL": {
    summary: "This screening showed a low chance for aneuploidy of other included chromosomes.",
    sections: [
      { label:"What this means", body:"A low risk NIPT result significantly reduces the risk for the screened aneuploidies; it does not eliminate the risk. This result does not guarantee a normal pregnancy outcome.", video_id:"1194749483", video_title:"Low Risk Aneuploidy" },
      { label:"What is NIPT?", body:"Non-invasive prenatal testing (NIPT) analyzes cell-free DNA from the placenta in the pregnant person's blood to assess the risk for certain chromosomal conditions." },
      { label:"Next steps", body:"Routine prenatal care is recommended. If you have questions about your result, please speak with your healthcare provider or a genetic counselor." },
    ],
    stats: [], action: null,
  },
  "ANP__LOW_RISK_TWIN_PARTIAL": {
    summary: "This screening showed a low chance for aneuploidy of other included chromosomes.",
    sections: [
      { label:"What this means", body:"A low risk NIPT result significantly reduces the risk for the screened aneuploidies in a twin pregnancy; it does not eliminate the risk. This result does not guarantee a normal pregnancy outcome.", video_id:"1194749483", video_title:"Low Risk Aneuploidy" },
      { label:"What is NIPT?", body:"NIPT for twin pregnancies analyzes cell-free DNA to assess the risk for chromosomal conditions. In some cases, zygosity testing may be performed for twin pregnancies. Note: sex chromosome aneuploidy screening is not performed for twin pregnancies.", video_id:"1194755920", video_title:"Understanding Zygosity" },
      { label:"Next steps", body:"Routine prenatal care is recommended. If you have questions about your result, please speak with your healthcare provider or a genetic counselor." },
    ],
    stats: [], action: null,
  },
  "ANP__HIGH_RISK_T21_SINGLETON": {
    summary: "This pregnancy is at high risk for Trisomy 21 (Down syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for Trisomy 21 (Down syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Unity Confirm™ may be available for certain pregnancies. See report for details. Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Trisomy 21", body:"Trisomy 21 (Down syndrome) is caused by an extra copy of chromosome 21. It is associated with intellectual disability and certain physical characteristics. Severity and health implications vary." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result, confirmatory testing options, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_T18_SINGLETON": {
    summary: "This pregnancy is at high risk for Trisomy 18 (Edwards syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for Trisomy 18 (Edwards syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Unity Confirm™ may be available for certain pregnancies. See report for details. Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Trisomy 18", body:"Trisomy 18 (Edwards syndrome) is caused by an extra copy of chromosome 18. It is associated with serious medical complications and is often life-limiting." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result, confirmatory testing options, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_T13_SINGLETON": {
    summary: "This pregnancy is at high risk for Trisomy 13 (Patau syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for Trisomy 13 (Patau syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Unity Confirm™ may be available for certain pregnancies. See report for details. Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Trisomy 13", body:"Trisomy 13 (Patau syndrome) is caused by an extra copy of chromosome 13. It is associated with serious medical complications and is often life-limiting." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result, confirmatory testing options, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_MX_SINGLETON": {
    summary: "This pregnancy is at high risk for Monosomy X (Turner syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for Monosomy X (Turner syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Monosomy X", body:"Monosomy X (Turner syndrome) occurs when a fetus has only one X chromosome. It only affects female and is associated with short stature, heart defects, and potential fertility issues. Health outcomes vary widely." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss this result, confirmatory testing, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_XXX_SINGLETON": {
    summary: "This pregnancy is at high risk for Trisomy X (XXX syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for Trisomy X (XXX syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Trisomy X (XXX Syndrome)", body:"Trisomy X (XXX syndrome) occurs when a female fetus has three X chromosomes. Many individuals with XXX syndrome have few or no symptoms, though some may experience learning differences or mild developmental delays." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss this result, confirmatory testing, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_XXY_SINGLETON": {
    summary: "This pregnancy is at high risk for XXY syndrome (Klinefelter syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for XXY syndrome (Klinefelter syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Klinefelter Syndrome (XXY)", body:"Klinefelter syndrome (XXY) occurs when a male fetus has an extra X chromosome. Many individuals with Klinefelter syndrome live healthy lives with few symptoms, though some may experience infertility or subtle developmental differences." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss this result, confirmatory testing, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_XYY_SINGLETON": {
    summary: "This pregnancy is at high risk for XYY syndrome (Jacob's syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the fetus is at high risk for XYY syndrome (Jacob's syndrome). Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About Jacob's Syndrome (XYY)", body:"XYY syndrome occurs when a male fetus has an extra Y chromosome. Most individuals with XYY syndrome are healthy and may be taller than average. Some may experience learning differences, though outcomes vary widely." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss this result, confirmatory testing, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_T21_TWIN": {
    summary: "This pregnancy is at high risk for Trisomy 21 (Down syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates a high risk for Trisomy 21 (Down syndrome) in one or both fetuses in this twin pregnancy. Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result and confirmatory testing options for a twin pregnancy." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_T18_TWIN": {
    summary: "This pregnancy is at high risk for Trisomy 18 (Edwards syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates a high risk for Trisomy 18 (Edwards syndrome) in one or both fetuses in this twin pregnancy. Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result and confirmatory testing options for a twin pregnancy." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__HIGH_RISK_T13_TWIN": {
    summary: "This pregnancy is at high risk for Trisomy 13 (Patau syndrome).",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates a high risk for Trisomy 13 (Patau syndrome) in one or both fetuses in this twin pregnancy. Note, Unity is a screening test, not a diagnostic test." },
      { label:"Next steps", body:"Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss the implications of this result and confirmatory testing options for a twin pregnancy." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "ANP__NO_CALL_REDRAW_SINGLETON": {
    summary: "We were unable to get enough information from this sample to provide a reliable result. Because we only report results when we are confident in their accuracy, a new blood sample has been requested to repeat the screening.",
    sections: [
      { label:"Next steps", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported.", video_id:"1194749532", video_title:"No Call Result" },
      { label:"Important note", body:"There is a slightly increased risk of aneuploidy associated with repeated no-call results. Comprehensive ultrasound and the option of diagnostic testing may be considered per your provider's recommendation (ACOG Practice Bulletin 226, 2020)." },
    ],
    stats: [], action: null,
  },
  "ANP__NO_CALL_REDRAW_TWIN": {
    summary: "We were unable to get enough information from this sample to provide a reliable result. Because we only report results when we are confident in their accuracy, a new blood sample has been requested to repeat the screening.",
    sections: [
      { label:"Next steps", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported.", video_id:"1194749532", video_title:"No Call Result" },
      { label:"Important note", body:"There is a slightly increased risk of aneuploidy associated with repeated no-call results. Comprehensive ultrasound and the option of diagnostic testing may be considered per your provider's recommendation (ACOG Practice Bulletin 226, 2020)." },
    ],
    stats: [], action: null,
  },
  "ANP__NO_CALL_FINAL_SINGLETON": {
    summary: "We were unable to get enough information from this sample to provide a reliable result. A repeat blood draw is not recommended at this time.",
    sections: [
      { label:"What this means", body:"The lab was unable to obtain enough data to report an accurate result, and a repeat blood draw is not indicated. This does not necessarily indicate a problem with your pregnancy. Speak with your provider about next steps.", video_id:"1194749532", video_title:"No Call Result" },
      { label:"Important note", body:"There is a slightly increased risk of aneuploidy associated with repeated no-call results. Comprehensive ultrasound and the option of diagnostic testing may be considered per your provider's recommendation (ACOG Practice Bulletin 226, 2020)." },
    ],
    stats: [], action: null,
  },
  "ANP__NO_CALL_FINAL_TWIN": {
    summary: "We were unable to get enough information from this sample to provide a reliable result. A repeat blood draw is not recommended at this time.",
    sections: [
      { label:"What this means", body:"The lab was unable to obtain enough data to report an accurate result for this twin pregnancy, and a repeat blood draw is not indicated. This does not necessarily indicate a problem with your pregnancy. Speak with your provider about next steps.", video_id:"1194749532", video_title:"No Call Result" },
      { label:"Important note", body:"There is a slightly increased risk of aneuploidy associated with repeated no-call results. Comprehensive ultrasound and the option of diagnostic testing may be considered per your provider's recommendation (ACOG Practice Bulletin 226, 2020)." },
    ],
    stats: [], action: null,
  },
  "ANP__QC_FAIL_REDRAW_SINGLETON": {
    summary: "Your sample did not meet the quality control requirements needed to report an accurate result. A new blood draw has been requested.",
    sections: [
      { label:"What this means", body:"This is a technical issue with the sample — it does not reflect anything about your health or your pregnancy's health. Possible reasons include poor sample quality, insufficient DNA extraction, or other technical factors." },
      { label:"Next steps", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported." },
    ],
    stats: [], action: null,
  },
  "ANP__QC_FAIL_REDRAW_TWIN": {
    summary: "Your sample did not meet the quality control requirements needed to report an accurate result. A new blood draw has been requested.",
    sections: [
      { label:"What this means", body:"This is a technical issue with the sample — it does not reflect anything about your health or your pregnancy's health. Possible reasons include poor sample quality, insufficient DNA extraction, or other technical factors." },
      { label:"Next steps", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported." },
    ],
    stats: [], action: null,
  },
  "ANP__QC_FAIL_FINAL_SINGLETON": {
    summary: "Your sample did not meet quality control requirements needed to report an accurate result. A final QC Fail has been issued.",
    sections: [
      { label:"What this means", body:"The laboratory was unable to obtain an accurate reportable result for aneuploidy screening. A redraw is not indicated. This can occur due to biological or technical factors." },
      { label:"Next steps", body:"Alternative methods for aneuploidy screening or the option of diagnostic testing can be considered. Please speak with your healthcare provider about available options." },
    ],
    stats: [], action: null,
  },
  "ANP__QC_FAIL_FINAL_TWIN": {
    summary: "Your sample did not meet quality control requirements needed to report an accurate result. A final QC Fail has been issued.",
    sections: [
      { label:"What this means", body:"The laboratory was unable to obtain an accurate reportable result for aneuploidy screening for this twin pregnancy. A redraw is not indicated. This can occur due to biological or technical factors." },
      { label:"Next steps", body:"Alternative methods for aneuploidy screening or the option of diagnostic testing can be considered. Please speak with your healthcare provider about available options." },
    ],
    stats: [], action: null,
  },
  "LOW_RISK_WITH_NO_CALL_FETAL_SEX_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, and 21. However, the test could not determine fetal sex or provide aneuploidy results for sex chromosome conditions.",
    sections: [
      { label:"What this means", body:"The laboratory was unable to determine the fetal sex, and therefore could not assess for sex chromosome conditions. This result does not reflect anything about your health or the pregnancy's health. This type of result can occur due to biological factors or if certain pregnancy information was unavailable at the time of testing." },
      { label:"What can cause this type of result?", body:"These types of results are often explained by missing or inaccurate clinical information including undisclosed use of an egg donor or gestational carrier, twins or higher order multiplets, or a vanishing twin. Speak with your healthcare provider to confirm the clinical information provided at the time of analysis is correct." },
      { label:"Next steps", body:"A reanalysis of the original sample can be performed if clinical information about the pregnancy has changed — a repeat blood draw is not indicated. Comprehensive ultrasound can be considered to evaluate fetal sex. If desired, prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis can be considered to evaluate for fetal monosomy X and sex chromosome conditions." },
    ],
    stats: [], action: null,
  },
  "LOW_RISK_WITH_MATERNAL_MX_SUSPECTED_FEMALE_FETUS_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, and 21. However, the test could not provide complete results for some sex chromosome conditions because the DNA pattern in the sample suggests the patient may have a difference involving the X chromosome.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the pattern of DNA suggests the patient may have a form of X chromosome mosaicism, meaning some cells may have a different number of X chromosomes than expected." },
      { label:"What this means for the pregnancy", body:"This finding does not mean there is a problem with the pregnancy health. However, because of this DNA pattern, the test could not reliably screen the pregnancy for specific sex chromosome conditions. Importantly, this does not mean the pregnancy is at increased risk for these conditions — only that the screening could not assess them accurately from this sample." },
      { label:"Next steps", body:"A repeat blood draw is not recommended, as another sample is unlikely to provide additional information. Chromosome analysis for the patient may be recommended to better understand this result. Your healthcare provider can discuss whether any additional evaluation or testing would be helpful based on your medical history, ultrasound findings, or personal preferences." },
    ],
    stats: [], action: null,
  },
  "LOW_RISK_WITH_MATERNAL_MX_SUSPECTED_MALE_FETUS_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, and 21. However, the test could not provide complete results for some sex chromosome conditions because the DNA pattern in the sample suggests the patient may have a difference involving the X chromosome.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the pattern of DNA suggests the patient may have a form of X chromosome mosaicism, meaning some cells may have a different number of X chromosomes than expected." },
      { label:"What this means for the pregnancy", body:"This finding does not mean there is a problem with the pregnancy health. However, because of this DNA pattern, the test could not reliably screen the pregnancy for specific sex chromosome conditions. Importantly, this does not mean the pregnancy is at increased risk for these conditions — only that the screening could not assess them accurately from this sample." },
      { label:"Next steps", body:"A repeat blood draw is not recommended, as another sample is unlikely to provide additional information. Chromosome analysis for the patient may be recommended to better understand this result. Your healthcare provider can discuss whether any additional evaluation or testing would be helpful based on your medical history, ultrasound findings, or personal preferences." },
    ],
    stats: [], action: null,
  },
  "LOW_RISK_WITH_MATERNAL_XXX_SUSPECTED_FEMALE_FETUS_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, and 21. However, the test could not provide complete results for some sex chromosome conditions because the DNA pattern in the sample suggests the patient may have a difference involving the X chromosome.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the pattern of DNA suggests the patient may have a form of X chromosome mosaicism, meaning some cells may have a different number of X chromosomes than expected." },
      { label:"What this means for the pregnancy", body:"This finding does not mean there is a problem with the pregnancy health. However, because of this DNA pattern, the test could not reliably screen the pregnancy for specific sex chromosome conditions. Importantly, this does not mean the pregnancy is at increased risk for these conditions — only that the screening could not assess them accurately from this sample." },
      { label:"Next steps", body:"A repeat blood draw is not recommended, as another sample is unlikely to provide additional information. Chromosome analysis for the patient may be recommended to better understand this result. Your healthcare provider can discuss whether any additional evaluation or testing would be helpful based on your medical history, ultrasound findings, or personal preferences." },
    ],
    stats: [], action: null,
  },
  "LOW_RISK_WITH_MATERNAL_XXX_SUSPECTED_MALE_FETUS_SINGLETON": {
    summary: "This screening showed a low chance for aneuploidy involving chromosomes 13, 18, and 21. However, the test could not provide complete results for some sex chromosome conditions because the DNA pattern in the sample suggests the patient may have a difference involving the X chromosome.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the pattern of DNA suggests the patient may have a form of X chromosome mosaicism, meaning some cells may have a different number of X chromosomes than expected." },
      { label:"What this means for the pregnancy", body:"This finding does not mean there is a problem with the pregnancy health. However, because of this DNA pattern, the test could not reliably screen the pregnancy for specific sex chromosome conditions. Importantly, this does not mean the pregnancy is at increased risk for these conditions — only that the screening could not assess them accurately from this sample." },
      { label:"Next steps", body:"A repeat blood draw is not recommended, as another sample is unlikely to provide additional information. Chromosome analysis for the patient may be recommended to better understand this result. Your healthcare provider can discuss whether any additional evaluation or testing would be helpful based on your medical history, ultrasound findings, or personal preferences." },
    ],
    stats: [], action: null,
  },
  "22Q_LOW_RISK": {
    summary: "This screening showed a low risk for 22q11.2 deletion syndrome.",
    sections: [
      { label:"What this means", body:"A low risk NIPT result significantly reduces the risk for a fetal 22q11.2 microdeletion; it does not eliminate the risk.", video_id:"1194744184", video_title:"Low Risk 22q11.2 Deletion" },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "22Q_HIGH_RISK": {
    summary: "This pregnancy is at high risk for 22q11.2 deletion syndrome.",
    sections: [
      { label:"What this means", body:"Cell-free DNA analysis indicates the pregnancy is at high risk for 22q11.2 deletion syndrome. NIPT is a screening test, not a diagnostic test. Confirmatory testing is needed before making any decisions." },
      { label:"Next steps", body:"Unity Confirm™ may be available for certain pregnancies. See report for details. Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended and should include chromosomal microarray analysis to evaluate for a fetal 22q11.2 microdeletion. No irreversible decisions about the pregnancy should be made based on these results alone." },
      { label:"About 22q11.2 Deletion Syndrome", body:"22q11.2 deletion syndrome can cause heart defects, immune problems, and developmental differences. Outcomes vary widely. Confirmatory diagnostic testing is needed to determine if the deletion is present." },
      { label:"Genetic counseling", body:"Comprehensive genetic counseling is strongly recommended to discuss this result, confirmatory testing options, and available support resources." },
    ],
    stats: [], action: { label:"Speak with a genetic counselor", type:"genetic_counseling" },
  },
  "22Q_MATERNAL_DETECTED": {
    summary: "This pregnancy is at high risk for 22q11.2 microdeletion syndrome. The DNA pattern in the sample suggests the patient themselves may have a 22q11.2 microdeletion. Because this condition can be inherited, the pregnancy has a higher chance of also having this microdeletion.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the DNA pattern suggests the patient may have a 22q11.2 microdeletion.\n\nPeople with a 22q11.2 microdeletion can have a wide range of features and health effects, while some people have very mild symptoms or may not know they have the condition. Because this is a screening result and not a diagnosis, additional testing is recommended to confirm whether you have this microdeletion." },
      { label:"What this means for the pregnancy", body:"If a pregnant patient has a 22q11.2 microdeletion, there is a 50% chance for each pregnancy to inherit it. For this reason, this pregnancy is considered at higher risk for 22q11.2 deletion syndrome.\n\nThis result does not confirm whether the pregnancy is affected. Diagnostic testing during pregnancy would be needed to know for certain." },
      { label:"Next steps", body:"Unity Confirm™ may be available for certain pregnancies. See report for details. Prenatal diagnosis via chorionic villus sampling (CVS) or amniocentesis is recommended and should include chromosomal microarray analysis. Additionally, a microarray for the pregnant patient is recommended to assess for a 22q11.2 microdeletion. No irreversible decisions about the pregnancy should be made based on these results alone." },
    ],
    stats: [], action: null,
  },
  "22Q_MATERNAL_INCOMPATIBLE": {
    summary: "This screening suggests the pregnant patient may have extra genetic material in the 22q11.2 region (a 22q11.2 duplication). Because of this DNA pattern, the test could not accurately evaluate the pregnancy for a 22q11.2 microdeletion.",
    sections: [
      { label:"What this means for me", body:"Most of the DNA analyzed in this screening comes from the pregnant patient's blood. In this sample, the DNA pattern suggests the patient may have a duplication involving the 22q11.2 region.\n\nPeople with a 22q11.2 duplication can have a wide range of features — some have no symptoms, while others may have medical, learning, or developmental differences. This test is not designed to diagnose maternal genetic conditions, and additional testing would be needed to confirm whether a duplication is truly present." },
      { label:"What this means for the pregnancy", body:"The suspected maternal duplication makes it difficult for the test to accurately assess the pregnancy's chance for a 22q11.2 microdeletion. Importantly, this result does not mean the pregnancy is at increased risk for a 22q11.2 microdeletion. Rather, it means the screening could not provide a reliable assessment for this condition from this sample." },
      { label:"Next steps", body:"A repeat blood draw is not recommended, as another sample is unlikely to provide additional information. Testing of the patient with chromosomal microarray may be considered to better understand this finding. Ultrasound and prenatal chromosomal microarray analysis via chorionic villus sampling (CVS) or amniocentesis can be considered if clinically indicated or desired." },
    ],
    stats: [], action: null,
  },
  "22Q_FIRST_NO_CALL_REDRAW_REQUESTED": {
    summary: "We were unable to get enough information from this sample to provide an accurate 22q11.2 microdeletion result. A new blood sample has been requested to repeat the screening.",
    sections: [
      { label:"What this means", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported.", video_id:"1194744184", video_title:"22q No Call Result" },
    ],
    stats: [], action: null,
  },
  "22Q_SECOND_NO_CALL_FINAL": {
    summary: "We were unable to get enough information from this sample to provide an accurate 22q11.2 microdeletion result. A repeat blood draw is not recommended at this time.",
    sections: [
      { label:"What this means", body:"The lab was unable to obtain enough data to report an accurate 22q11.2 microdeletion result, and a repeat blood draw is not indicated. This does not necessarily indicate a problem with your pregnancy. Speak with your provider about next steps.", video_id:"1194744184", video_title:"22q No Call Result" },
      { label:"Next steps", body:"Ultrasound and prenatal chromosomal microarray analysis via chorionic villus sampling (CVS) or amniocentesis can be considered to evaluate for a fetal 22q11.2 microdeletion if clinically indicated or desired." },
    ],
    stats: [], action: null,
  },
  "22Q_QC_FAIL_REDRAW_REQUESTED": {
    summary: "Your sample did not meet the quality control requirements needed to report an accurate 22q11.2 microdeletion result. A new blood draw has been requested.",
    sections: [
      { label:"What this means", body:"This is a technical issue with the sample — it does not reflect anything about your health or your pregnancy's health. Possible reasons include poor sample quality, insufficient DNA extraction, or other technical factors." },
    ],
    stats: [], action: null,
  },
  "22Q_QC_FAIL_FINAL": {
    summary: "Your sample did not meet quality control requirements needed to report an accurate 22q11.2 microdeletion result. A final QC Fail has been issued.",
    sections: [
      { label:"What this means", body:"The laboratory was unable to obtain an accurate reportable result for a 22q11.2 microdeletion. A redraw is not indicated. This can occur due to biological or technical factors." },
      { label:"Next steps", body:"Ultrasound and prenatal chromosomal microarray analysis via chorionic villus sampling (CVS) or amniocentesis can be considered to evaluate for a fetal 22q11.2 microdeletion if clinically indicated or desired." },
    ],
    stats: [], action: null,
  },
  "RHD_DETECTED": {
    summary: "This screening detected the RHD gene in this sample (RhD positive).",
    sections: [
      { label:"What this means", body:"For most pregnancies, this result does not affect pregnancy care. The meaning of this result depends on your own blood type.\n\n• If your blood type is RhD positive, this result is expected and is not clinically important.\n• If your blood type is RhD negative, this result suggests the baby is likely RhD positive, which may help guide decisions about Rh immune globulin (Rhogam) during pregnancy.\n\nThis result does not indicate a health problem for the pregnancy.", video_id:"1172986590", video_title:"RhD Detected" },
    ],
    stats: [], action: null,
  },
  "RHD_NOT_DETECTED": {
    summary: "This screening did not detect the RHD gene in this sample (RhD negative).",
    sections: [
      { label:"What this means", body:"This result suggests the fetus is likely RhD negative. For pregnant patients who are also RhD negative, this usually means Rh immune globulin (Rhogam) is not needed during pregnancy.\n\nThis result does not indicate a health problem for the pregnancy.", video_id:"1172988446", video_title:"RhD Not Detected" },
    ],
    stats: [], action: null,
  },
  "RHD_NO_CALL_REDRAW_REQUESTED": {
    summary: "We were unable to get enough information from this sample to provide an accurate RhD result. A new blood sample has been requested to repeat the screening.",
    sections: [
      { label:"What this means", body:"A redraw of two additional tubes of blood is requested for repeat NIPT. Once a new sample is received and processed, a result will be reported.", video_id:"1194749532", video_title:"No Call Result" },
    ],
    stats: [], action: null,
  },
  "RHD_NO_CALL_FINAL": {
    summary: "We were unable to get enough information from this sample to provide an accurate RhD result. A repeat blood draw is not recommended at this time.",
    sections: [
      { label:"What this means", body:"The lab was unable to obtain enough data to report an accurate RhD result, and a repeat blood draw is not indicated. This does not necessarily indicate a problem with your pregnancy. Speak with your provider about next steps.", video_id:"1194749532", video_title:"No Call Result" },
      { label:"Next steps", body:"Speak with your healthcare provider about recommended pregnancy surveillance and management based on your clinical history." },
    ],
    stats: [], action: null,
  },
  "FETAL_ANTIGEN_DETECTED": {
    summary: "This screening detected the specific fetal antigen in this sample (Antigen positive).",
    sections: [
      { label:"What this means", body:"The pregnant patient's medical records indicate alloimmunization for this fetal antigen. This result suggests the fetus is likely antigen positive.\n\nWhen a pregnant patient has antibodies and the pregnancy is antigen positive, there is an increased chance for a condition called hemolytic disease of the fetus and newborn (HDFN), where the antibodies can affect the pregnancy's red blood cells.\n\nThis result does not confirm that complications will occur, but it helps guide pregnancy monitoring and management.", video_id:"1172979698", video_title:"Fetal Antigen Detected" },
      { label:"Next steps", body:"These results should be interpreted together with the patient's medical history, antibody testing, and ultrasound findings. Your healthcare provider may recommend additional monitoring during pregnancy to evaluate the fetus for signs of anemia or related complications." },
    ],
    stats: [], action: null,
  },
  "FETAL_ANTIGEN_NOT_DETECTED": {
    summary: "This screening did not detect the specific fetal antigen in this sample (Antigen negative).",
    sections: [
      { label:"What this means", body:"The pregnant patient's medical records indicate alloimmunization for this fetal antigen. This result suggests the fetus is likely antigen negative.\n\nIn pregnancies where the pregnancy is antigen negative, antibodies are not expected to affect the pregnancy's red blood cells. This generally means there is a lower chance for hemolytic disease of the fetus and newborn (HDFN) related to antibodies.", video_id:"1172988446", video_title:"Fetal Antigen Not Detected" },
      { label:"Next steps", body:"Your healthcare provider will interpret these results together with the patient's medical history and antibody testing to determine whether any additional monitoring or follow-up is needed during the pregnancy." },
    ],
    stats: [], action: null,
  },
};

// Resolve the ANP static content key from panel id + condition status + gestation.
// When the real API is wired in, the BI profile code will come directly from the response.
function getANPStaticKey(panelId, conditionId, status, gestation, panelHasHighRisk=false) {
  const twin = gestation === "twin";
  if (panelId === "aneuploidy") {
    if (status === "low_risk")   return panelHasHighRisk
      ? (twin ? "ANP__LOW_RISK_TWIN_PARTIAL" : "ANP__LOW_RISK_SINGLETON_PARTIAL")
      : (twin ? "ANP__LOW_RISK_TWIN"         : "ANP__LOW_RISK_SINGLETON");
    if (status === "high_risk") {
      const map = { T21:"ANP__HIGH_RISK_T21", T18:"ANP__HIGH_RISK_T18", T13:"ANP__HIGH_RISK_T13",
                    MX:"ANP__HIGH_RISK_MX_SINGLETON", XXX:"ANP__HIGH_RISK_XXX_SINGLETON",
                    XXY:"ANP__HIGH_RISK_XXY_SINGLETON", XYY:"ANP__HIGH_RISK_XYY_SINGLETON" };
      const base = map[conditionId];
      if (!base) return null;
      if (["T21","T18","T13"].includes(conditionId)) return `${base}_${twin?"TWIN":"SINGLETON"}`;
      return base;
    }
    if (status === "no_call")    return twin ? "ANP__NO_CALL_REDRAW_TWIN"      : "ANP__NO_CALL_REDRAW_SINGLETON";
    if (status === "qc_fail")    return twin ? "ANP__QC_FAIL_REDRAW_TWIN"      : "ANP__QC_FAIL_REDRAW_SINGLETON";
  }
  if (panelId === "22q") {
    if (status === "low_risk")   return "22Q_LOW_RISK";
    if (status === "high_risk")  return "22Q_HIGH_RISK";
    if (status === "no_call")    return "22Q_FIRST_NO_CALL_REDRAW_REQUESTED";
    if (status === "qc_fail")    return "22Q_QC_FAIL_REDRAW_REQUESTED";
  }
  if (panelId === "rhd") {
    if (status === "detected")     return "RHD_DETECTED";
    if (status === "not_detected") return "RHD_NOT_DETECTED";
    if (status === "no_call")      return "RHD_NO_CALL_REDRAW_REQUESTED";
  }
  if (panelId === "antigen_c" || panelId === "antigen_k") {
    if (status === "detected")     return "FETAL_ANTIGEN_DETECTED";
    if (status === "not_detected") return "FETAL_ANTIGEN_NOT_DETECTED";
  }
  return null;
}

// getStaticKey returns "SMA_SNP" for the SMN silent carrier scenario.
// VIDEO_MAP needs an entry for that key too so the carrier path finds it.
// (The spreadsheet uses SMN_SILENT_CARRIER as the BI profile; we map both.)

// Key structure: INFO_SHEETS[carrier_profile_code][cfDNA_profile_code]
// cfDNA key "noreflex" covers X-linked / no-cfDNA conditions.
// Each sheet mirrors the patient-facing PDF handout sections.
const INFO_SHEETS = {

  // ── Alpha-Thalassemia silent carrier (αα/α-) ──────────────────────────────
  "ATHAL_SILENT_aa/a-": {
    lowrisk: {
      headline: "You are a silent carrier. Your baby is at low risk.",
      headlineRisk: "low_risk",
      yourStatus: {
        title: "Silent carrier of alpha-thalassemia",
        body: "You have three working copies of the four alpha-globin genes. Silent carriers are typically healthy and have no symptoms.",
        detail: "Genotype: αα/α· · 3 of 4 alpha-globin genes working",
      },
      fetalRisk: {
        title: "Very low risk",
        body: "Silent carriers (αα/α-) have an extremely low risk — less than 1 in 100,000 — of having a child with hemoglobin Bart's disease.",
      },
      disease: {
        title: "Understanding alpha-thalassemia",
        subtitle: "Severity depends on how many alpha-globin genes are working.",
        body: "Everyone has four alpha-globin genes — two from each parent. The number of working copies determines whether a person has any symptoms. Silent carriers (3 working genes) are healthy and typically have no symptoms at all.",
      },
      nextSteps: [
        { n:"01", label:"Reproductive partner screening", body:"Carrier screening for alpha-thalassemia is typically offered to the reproductive partners of carriers, before a future pregnancy. Talk to your provider." },
        { n:"02", label:"Sharing results with blood relatives", body:"Your parents, siblings, and children each have a 50% chance of also being a silent carrier. Sharing these results with blood relatives, especially those of reproductive age, can help them understand their own risk." },
        { n:"03", label:"Talking with a genetic counselor", body:"A complimentary telephone consultation is available to walk you through what these results mean for you, your pregnancy, and your family — at no additional cost." },
      ],
      resources: [
        { label:"Cooley's Anemia Foundation", url:"https://thalassemia.org" },
        { label:"National Organization for Rare Disorders", url:"https://rarediseases.org/rare-diseases/alpha-thalassemia" },
      ],
      important: null,
    },
  },

  // ── Sickle cell carrier (HbS het) ─────────────────────────────────────────
  POSITIVE_HBS: {
    lowrisk: {
      headline: "You are a carrier. Your baby is at low risk.",
      headlineRisk: "low_risk",
      yourStatus: {
        title: "Carrier of sickle cell disease",
        body: "You have one non-working copy of the HBB gene. Carriers are typically healthy and don't experience symptoms.",
        detail: "Variant: c.20A>T (p.Glu7Val) · sickle cell",
      },
      fetalRisk: {
        title: "Low risk",
        body: "Cell-free DNA analysis did not detect a paternally-inherited HBB variant. This significantly reduces — but does not eliminate — the fetal risk. Refer to your personalized report for the specific risk estimate.",
      },
      disease: {
        title: "Understanding sickle cell disease",
        subtitle: "What sickle cell disease is, and what to expect.",
        body: "Affected red blood cells become 'C'-shaped instead of round. They can get stuck in small blood vessels, limiting oxygen flow and causing pain episodes, fatigue, and organ stress over time. Treatments continue to advance significantly.",
      },
      nextSteps: [
        { n:"01", label:"Reproductive partner screening", body:"Carrier screening for sickle cell disease is typically offered to the reproductive partners of carriers. Talk to your provider about partner screening before or during future pregnancies." },
        { n:"02", label:"Sharing results with blood relatives", body:"Your parents, siblings, and children each have a 50% chance of also being a carrier. Sharing these results can help them understand their own carrier risk." },
        { n:"03", label:"Talking with a genetic counselor", body:"A complimentary telephone consultation is available to walk you through what these results mean for you, your pregnancy, and your family — at no additional cost." },
      ],
      resources: [
        { label:"American Sickle Cell Anemia Association", url:"https://ascaa.org" },
        { label:"CDC: Sickle Cell Disease", url:"https://cdc.gov/sickle-cell" },
      ],
      important: null,
    },
    highrisk: {
      headline: "You are a carrier. Your baby is at high risk for sickle cell disease.",
      headlineRisk: "high_risk",
      yourStatus: {
        title: "Carrier of sickle cell disease",
        body: "You have one non-working copy of the HBB gene. Carriers are typically healthy and don't experience symptoms.",
        detail: "Variant: c.20A>T (p.Glu7Val) · sickle cell",
      },
      fetalRisk: {
        title: "High risk — likely affected",
        body: "Your screen suggests your baby has likely inherited two non-working copies of the HBB gene — one from each parent. This is a screening result, not a diagnosis. Confirmatory testing can clarify the result.",
      },
      disease: {
        title: "Understanding sickle cell disease",
        subtitle: "What sickle cell disease is, and what to expect.",
        body: "Affected red blood cells become 'C'-shaped instead of round. They can get stuck in small blood vessels, limiting oxygen flow and causing pain episodes, fatigue, and organ stress over time. Treatments include pain management, blood transfusions, and emerging gene therapies. Outcomes continue to improve significantly.",
      },
      important: "This is a screening result, not a diagnosis. UNITY Fetal Risk Screen is highly accurate but not diagnostic. No irreversible decisions about your pregnancy should be made based on this result alone. Diagnostic testing (CVS or amniocentesis) can confirm whether your baby is affected.",
      nextSteps: [
        { n:"01", label:"Confirmatory diagnostic testing", body:"Two prenatal options can confirm whether your baby is affected: CVS (10–13 weeks) — a small sample of placental tissue; or amniocentesis (15–24 weeks) — a small sample of amniotic fluid. Both are generally safe but carry a small risk of complications." },
        { n:"02", label:"Cord blood banking program — cost covered", body:"BillionToOne covers the cost of cord blood collection and first-year storage for patients with high-risk HBB results. Stem cells from cord blood may aid future treatment. A genetic counselor can share details." },
        { n:"03", label:"Talking with a genetic counselor", body:"A complimentary telephone consultation is available to walk you through what these results mean for you, your pregnancy, and your family — at no additional cost." },
      ],
      resources: [
        { label:"American Sickle Cell Anemia Association", url:"https://ascaa.org" },
        { label:"Sickle Cell Information Center", url:"https://scinfo.org" },
        { label:"CDC: Sickle Cell Disease", url:"https://cdc.gov/sickle-cell" },
      ],
    },
  },

  // ── DMD carrier (X-linked) ─────────────────────────────────────────────────
  POSITIVE: {
    // DMD uses noreflex because cfDNA fetal sex determines risk but no cfDNA risk score is produced
    noreflex: {
      headline: "You are a carrier. Your baby is at high risk for Duchenne / Becker muscular dystrophy.",
      headlineRisk: "high_risk",
      yourStatus: {
        title: "Carrier of DMD-associated dystrophinopathy",
        body: "You have one non-working copy of the DMD gene on one of your X chromosomes. Most female carriers don't have severe symptoms, though some experience muscle or heart-related effects.",
        detail: "Gene: DMD · X-linked inheritance",
      },
      fetalRisk: {
        title: "Likely affected (if male fetus)",
        body: "Each pregnancy has a 50% chance of inheriting your DMD variant. Males who inherit it are expected to be affected. Diagnostic testing can confirm whether your baby is affected. cfDNA fetal risk assessment is not available for the DMD gene.",
      },
      disease: {
        title: "Understanding DMD-associated dystrophinopathies",
        subtitle: "A spectrum of muscle and heart conditions.",
        body: "DMD-related conditions cause progressive muscle wasting. The most severe form (Duchenne) often requires a wheelchair by the teen years; milder forms (Becker, dilated cardiomyopathy) progress more slowly. The condition can also progressively enlarge the heart muscle (cardiomyopathy). Treatments are advancing, and many people now live into their 20s, 30s, or beyond.",
      },
      important: "This is a screening result, not a diagnosis. UNITY Fetal Risk Screen is highly accurate but not diagnostic. No irreversible decisions about your pregnancy should be made based on this result alone.",
      nextSteps: [
        { n:"01", label:"Confirmatory diagnostic testing", body:"Two prenatal options can confirm whether your baby is affected: CVS (10–13 weeks) or amniocentesis (15–24 weeks). Both are generally safe but carry a small risk of complications. If testing during pregnancy isn't done, share this result with your baby's pediatrician." },
        { n:"02", label:"Cardiology evaluation — for you", body:"Female DMD carriers have an increased risk of cardiomyopathy and other heart-related issues in adulthood. A cardiology evaluation can help monitor and manage any heart involvement early. Talk with your provider about whether a referral is appropriate." },
        { n:"03", label:"Talking with a genetic counselor", body:"A complimentary telephone consultation is available to walk you through what these results mean — at no additional cost." },
      ],
      resources: [
        { label:"CureDuchenne", url:"https://cureduchenne.org" },
        { label:"Muscular Dystrophy Association", url:"https://mda.org/disease/duchenne-muscular-dystrophy" },
        { label:"Parent Project Muscular Dystrophy", url:"https://parentprojectmd.org" },
      ],
    },
  },

  // ── SMN1 SNP present (ancestry-dependent) ─────────────────────────────────
  SMN_SILENT_CARRIER: {
    snp_present: {
      headline: "Your result needs context. SMA carrier risk depends on ancestry.",
      headlineRisk: "snp_present",
      yourStatus: {
        title: "SMN1 SNP present · carrier status not determined",
        body: "You have two copies of the SMN1 gene plus a small genetic change called the rs143838139 SNP. This finding does not confirm carrier status — but the chance of being a silent carrier of SMA varies meaningfully by ancestry.",
        detail: "Marker: rs143838139 SNP · 2 copies of SMN1 · autosomal recessive",
      },
      fetalRisk: {
        title: "Risk depends on ancestry",
        body: "Most people with this SNP are not silent carriers, but the likelihood depends on your ancestry. If Ashkenazi Jewish: you are likely a silent carrier. For all other backgrounds: your chance of being a silent carrier is low (~1–3%).",
      },
      disease: {
        title: "Understanding spinal muscular atrophy (SMA)",
        subtitle: "What this SNP means and why ancestry matters.",
        body: "Most carriers of SMA have one copy of the SMN1 gene. A small number — called silent carriers — have two copies on the same chromosome (2+0) and one copy on the other. Your result falls into this less common category, and its significance depends on your ethnic background.",
      },
      important: null,
      ethnicityTable: [
        { ancestry:"Ashkenazi Jewish",  silentCarrierRisk:"Likely carrier",   paternalFreq:"1 in 67",  fetalRisk:"1 in 268"    },
        { ancestry:"African American",  silentCarrierRisk:"1 in 39",          paternalFreq:"1 in 72",  fetalRisk:"1 in 11,232" },
        { ancestry:"Asian",             silentCarrierRisk:"1 in 61",          paternalFreq:"1 in 59",  fetalRisk:"1 in 14,396" },
        { ancestry:"Hispanic",          silentCarrierRisk:"1 in 99",          paternalFreq:"1 in 68",  fetalRisk:"1 in 26,928" },
        { ancestry:"Northern European", silentCarrierRisk:"1 in 69",          paternalFreq:"1 in 47",  fetalRisk:"1 in 12,972" },
        { ancestry:"General population",silentCarrierRisk:"Unknown",          paternalFreq:"1 in 54",  fetalRisk:"Not calculated"},
      ],
      nextSteps: [
        { n:"01", label:"If Ashkenazi Jewish — partner screening is important", body:"With Ashkenazi Jewish ancestry, this SNP suggests you very likely carry an SMA variant. Your reproductive partner's carrier status determines the risk to your pregnancy. Talk to your provider about carrier screening for your partner." },
        { n:"02", label:"If other ancestry — discuss with your provider", body:"Without further testing, it is not possible to confirm whether you are a carrier of SMA. Your chance of being a silent carrier is low (~1–3%). Talk to your provider about whether further testing is appropriate for your situation." },
        { n:"03", label:"Sharing results with blood relatives", body:"Your parents, siblings, and children each have a 50% chance of having the same SNP. Sharing this result with blood relatives, especially those of reproductive age, can help them understand their own carrier risk." },
      ],
      resources: [
        { label:"Cure SMA", url:"https://curesma.org" },
        { label:"SMA Foundation", url:"https://smafoundation.org" },
        { label:"National Organization for Rare Disorders", url:"https://rarediseases.org/rare-diseases/spinal-muscular-atrophy" },
      ],
    },
  },
};

// Map cfDNA_profile_code values to our INFO_SHEETS second-level keys
const CFDNA_TO_SHEET_KEY = {
  lowrisk:        "lowrisk",
  lowrisk_bart:   "lowrisk",
  highrisk:       "highrisk",
  increasedrisk:  "increasedrisk",
  decreasedrisk:  "decreasedrisk",
  nocall_final:   "nocall",
  nocall_redraw:  "nocall",
  noreflex:       "noreflex",
  // SMN1 SNP gets a special key
  snp_present:    "snp_present",
};

function getInfoSheet(condition, report) {
  const carrierCode = condition.carrier_profile_code || condition.carrier_status;
  const fr = getFetalRisk(report, condition.condition_id);
  // Determine cfDNA sheet key
  let cfKey = "noreflex";
  if (fr) {
    cfKey = CFDNA_TO_SHEET_KEY[fr.cfDNA_profile_code] || CFDNA_TO_SHEET_KEY[fr.fetal_risk_status] || "noreflex";
  }
  // SMN1 SNP special case
  if (condition.carrier_status === "snp_present") {
    return INFO_SHEETS["SMN_SILENT_CARRIER"]?.["snp_present"] || null;
  }
  const byCarrier = INFO_SHEETS[carrierCode];
  if (!byCarrier) return null;
  return byCarrier[cfKey] || byCarrier["noreflex"] || Object.values(byCarrier)[0] || null;
}

// ─── Carrier scenarios ────────────────────────────────────────────────────────
const CARRIER_SCENARIOS = {
  hbb_low_risk: {
    label:"HBB Positive · Low Risk", report_type:"standard",
    report_meta:{ report_id:"UN-RPT-017-2602", date_reported:"2025-06-12", panel_type:"carrier_screen_plus_cfDNA", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"positive", overall_fetal_risk_status:"low_risk", fetal_fraction_percent:10.4,
      follow_up_recommendations:[
        { priority:1, type:"genetic_counseling", text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone consultation.", urgent:false },
      ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",                       gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                         gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell Disease / Beta-Thalassemia",  gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"positive",
        variant_detail:{ variant_name:"Sickle cell: c.20A>T (p.Glu7Val)", hgvs:"c.20A>T", transcript:"NM_000518.5", variant_class:"pathogenic", frame_type:"not_applicable" }, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",                 gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:"2 SMN1 copies, SNP not present" },
    ]},
    cfDNA_assessment:{ fetal_sex:"unknown", singleton_pregnancy:true, conditions:[
      { condition_id:"SICKLE_CELL", cfDNA_performed:true, cfDNA_profile_code:"lowrisk", fetal_risk_status:"low_risk", fetal_risk_percent:null, risk_before_cfDNA:"1 in 32 – 1 in 656", risk_after_cfDNA:"< 1 in 3,200" },
    ]},
    interpretation:{
      carrier_screen_positive:[{ condition_id:"SICKLE_CELL", clinical_text:"This patient has the c.20A>T (p.Glu7Val) (sickle cell) pathogenic variant in the HBB gene (NM_000518.5) and is a CARRIER for sickle cell disease. Carriers are typically healthy and do not have symptoms.", inheritance_risk:{} }],
      cfDNA_interpretation:[{ condition_id:"SICKLE_CELL", clinical_text:"The fetus is LOW RISK. No paternally inherited HBB variants were detected in the cell-free DNA. This result significantly reduces, but does not eliminate, the risk." }],
    },
    explanation_hints:{ SICKLE_CELL:{ condition_id:"SICKLE_CELL", patient_carrier:true, fetal_risk_status:"low_risk", variant_name:"Sickle cell: c.20A>T (p.Glu7Val)" } },
  },
  hbb_high_risk: {
    label:"HBB Positive · High Risk", report_type:"high_risk",
    report_meta:{ report_id:"UN-RPT-011-2602", date_reported:"2025-06-12", panel_type:"carrier_screen_plus_cfDNA", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"positive", overall_fetal_risk_status:"high_risk", fetal_fraction_percent:2.4,
      follow_up_recommendations:[
        { priority:1, type:"prenatal_diagnosis", text:"Prenatal diagnosis via chorionic villus sampling or amniocentesis is recommended for sickle cell disease.", urgent:true },
        { priority:2, type:"genetic_counseling",  text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone consultation.", urgent:false },
      ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",                       gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                         gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell Disease / Beta-Thalassemia",  gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"positive",
        variant_detail:{ variant_name:"Sickle cell: c.20A>T (p.Glu7Val)", hgvs:"c.20A>T", transcript:"NM_000518.5", variant_class:"pathogenic", frame_type:"not_applicable" }, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",                 gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:"3 SMN1 copies, SNP not present" },
    ]},
    cfDNA_assessment:{ fetal_sex:"unknown", singleton_pregnancy:true, conditions:[
      { condition_id:"SICKLE_CELL", cfDNA_performed:true, fetal_risk_status:"high_risk", fetal_risk_percent:90, risk_before_cfDNA:"1 in 32 – 1 in 656", risk_after_cfDNA:"9 in 10", cord_blood_banking:true },
    ]},
    interpretation:{
      carrier_screen_positive:[{ condition_id:"SICKLE_CELL", clinical_text:"This patient has the c.20A>T (p.Glu7Val) (sickle cell) pathogenic variant in the HBB gene and is a CARRIER for sickle cell disease.", inheritance_risk:{} }],
      cfDNA_interpretation:[{ condition_id:"SICKLE_CELL", clinical_text:"The fetus is at HIGH RISK to be homozygous for the sickle cell variant. Prenatal diagnosis is recommended. UNITY Fetal Risk Screen is not diagnostic — no irreversible decisions should be made without confirmatory invasive prenatal testing." }],
    },
    explanation_hints:{ SICKLE_CELL:{ condition_id:"SICKLE_CELL", patient_carrier:true, fetal_risk_status:"high_risk", fetal_risk_percent:90, variant_name:"Sickle cell: c.20A>T (p.Glu7Val)" } },
  },
  sma_snp: {
    label:"SMN1 SNP Present", report_type:"standard",
    report_meta:{ report_id:"UN-RPT-022-2602", date_reported:"2025-09-15", panel_type:"carrier_screen_plus_cfDNA", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"snp_present", overall_fetal_risk_status:"not_performed", fetal_fraction_percent:null,
      follow_up_recommendations:[
        { priority:1, type:"other",            text:"Carrier screening for SMA for the father of the pregnancy is recommended if you are Ashkenazi Jewish, and can be considered for any background.", urgent:false },
        { priority:2, type:"genetic_counseling",text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone consultation.", urgent:false },
      ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",                       gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"negative",    variant_detail:null, additional_detail:null },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                         gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"negative",    variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell Disease / Beta-Thalassemia",  gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"negative",    variant_detail:null, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",                 gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"snp_present", variant_detail:null, additional_detail:"2 SMN1 copies, SNP present" },
    ]},
    cfDNA_assessment:{ fetal_sex:"unknown", singleton_pregnancy:true, conditions:[
      { condition_id:"SMA", cfDNA_performed:false, cfDNA_not_performed_reason:"cfDNA cannot be performed when rs143838139 SNP is present with 2 SMN1 copies.", fetal_risk_status:"not_performed" },
    ]},
    interpretation:{ carrier_screen_positive:[], cfDNA_interpretation:[] },
    explanation_hints:{},
    static_explanation_map:{ SMA:"SMA_SNP" },
  },
  dmd_high_risk: {
    label:"DMD Carrier · High Risk", report_type:"high_risk",
    report_meta:{ report_id:"UN-RPT-031-2602", date_reported:"2025-06-12", panel_type:"carrier_screen_plus_cfDNA", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"positive", overall_fetal_risk_status:"high_risk", fetal_fraction_percent:9.2,
      follow_up_recommendations:[
        { priority:1, type:"prenatal_diagnosis", text:"Prenatal diagnosis via chorionic villus sampling or amniocentesis is recommended for DMD-associated dystrophinopathy.", urgent:true },
        { priority:2, type:"cardiology_eval",    text:"A cardiology evaluation may be appropriate for you. Female DMD carriers have an increased risk of cardiomyopathy in adulthood.", urgent:false },
        { priority:3, type:"genetic_counseling", text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone consultation.", urgent:false },
      ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",                gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"negative",  variant_detail:null, additional_detail:null },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                  gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"negative",  variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell / Beta-Thalassemia",   gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"negative",  variant_detail:null, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",          gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"negative",  variant_detail:null, additional_detail:"2 SMN1 copies, SNP not present" },
      { condition_id:"DMD",               condition_name:"DMD-Associated Dystrophinopathy",  gene_symbols:["DMD"],         panel:"acog_guideline", carrier_status:"positive",
        carrier_profile_code:"POSITIVE",
        variant_detail:{ variant_name:"Exon 50 deletion", hgvs:"c.(7201+1_7202-1)_(7659+1_7660-1)del", transcript:"NM_004006.3", variant_class:"pathogenic", frame_type:"out_of_frame" }, additional_detail:"X-linked · out-of-frame deletion" },
    ]},
    cfDNA_assessment:{ fetal_sex:"male", singleton_pregnancy:true, conditions:[
      { condition_id:"DMD", cfDNA_performed:false, cfDNA_not_performed_reason:"cfDNA fetal risk assessment is not available for the DMD gene.", fetal_risk_status:"high_risk", cfDNA_profile_code:"noreflex" },
    ]},
    interpretation:{
      carrier_screen_positive:[{ condition_id:"DMD", clinical_text:"This patient has an out-of-frame deletion of exon 50 in the DMD gene (NM_004006.3) and is a CARRIER for DMD-associated dystrophinopathy. The fetal sex is male. Males who inherit this variant are expected to be affected.", inheritance_risk:{} }],
      cfDNA_interpretation:[],
    },
    explanation_hints:{ DMD:{ condition_id:"DMD", patient_carrier:true, fetal_risk_status:"high_risk", variant_name:"Exon 50 deletion (out-of-frame)" } },
  },
  athal_silent_low: {
    label:"Alpha-Thal Silent · Low Risk", report_type:"standard",
    report_meta:{ report_id:"UN-RPT-041-2602", date_reported:"2025-06-12", panel_type:"carrier_screen_plus_cfDNA", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"positive", overall_fetal_risk_status:"low_risk", fetal_fraction_percent:11.2,
      follow_up_recommendations:[
        { priority:1, type:"other",            text:"Carrier screening for alpha-thalassemia is typically offered to the reproductive partners of carriers before a future pregnancy.", urgent:false },
        { priority:2, type:"genetic_counseling",text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone consultation.", urgent:false },
      ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",               gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"positive",
        carrier_profile_code:"ATHAL_SILENT_aa/a-",
        variant_detail:{ variant_name:"3.7 kb deletion (αα/α-)", hgvs:"α-3.7 deletion", transcript:null, variant_class:"pathogenic", frame_type:"not_applicable" }, additional_detail:"Silent carrier (αα/α-) · 3 of 4 genes working" },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                 gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell / Beta-Thalassemia",  gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",         gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"negative", variant_detail:null, additional_detail:"2 SMN1 copies, SNP not present" },
    ]},
    cfDNA_assessment:{ fetal_sex:"unknown", singleton_pregnancy:true, conditions:[
      { condition_id:"ALPHA_THALASSEMIA", cfDNA_performed:true, cfDNA_profile_code:"lowrisk", fetal_risk_status:"low_risk", fetal_risk_percent:null, risk_before_cfDNA:"1 in 2,280", risk_after_cfDNA:"< 1 in 100,000" },
    ]},
    interpretation:{
      carrier_screen_positive:[{ condition_id:"ALPHA_THALASSEMIA", clinical_text:"This patient has the 3.7 kb alpha-globin deletion and is a SILENT CARRIER for alpha-thalassemia. Silent carriers have 3 of 4 working alpha-globin genes and are typically healthy with no symptoms.", inheritance_risk:{} }],
      cfDNA_interpretation:[{ condition_id:"ALPHA_THALASSEMIA", clinical_text:"The fetus is at VERY LOW RISK for hemoglobin Bart's disease. This result reflects the extremely low risk associated with a silent carrier status." }],
    },
    explanation_hints:{ ALPHA_THALASSEMIA:{ condition_id:"ALPHA_THALASSEMIA", patient_carrier:true, fetal_risk_status:"low_risk" } },
  },
  no_call: {
    label:"No Call · Redraw", report_type:"no_call",
    report_meta:{ report_id:"UN-RPT-023-2602", date_reported:"2025-08-12", panel_type:"carrier_screen_only", panels_included:["acog_guideline"] },
    patient:{ name:"Jane Doe", dob:"1901-01-01", gestational_age_at_draw:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"1035 O'Brien Dr., Suite 112", address:"Menlo Park, CA 94025", phone:"6504602551" },
    summary:{
      overall_carrier_status:"no_call", overall_fetal_risk_status:"not_applicable", fetal_fraction_percent:null,
      follow_up_recommendations:[ { priority:1, type:"other", text:"A redraw of two additional tubes of blood is requested for repeat carrier screening.", urgent:true } ],
    },
    carrier_screen:{ conditions:[
      { condition_id:"ALPHA_THALASSEMIA", condition_name:"Alpha-Thalassemia",                       gene_symbols:["HBA1","HBA2"], panel:"acog_guideline", carrier_status:"no_call", variant_detail:null, additional_detail:null },
      { condition_id:"CYSTIC_FIBROSIS",   condition_name:"Cystic Fibrosis",                         gene_symbols:["CFTR"],        panel:"acog_guideline", carrier_status:"no_call", variant_detail:null, additional_detail:null },
      { condition_id:"SICKLE_CELL",       condition_name:"Sickle Cell Disease / Beta-Thalassemia",  gene_symbols:["HBB"],         panel:"acog_guideline", carrier_status:"no_call", variant_detail:null, additional_detail:null },
      { condition_id:"SMA",               condition_name:"Spinal Muscular Atrophy",                 gene_symbols:["SMN1"],        panel:"acog_guideline", carrier_status:"no_call", variant_detail:null, additional_detail:null },
    ]},
    cfDNA_assessment:{ fetal_sex:"unknown", singleton_pregnancy:true, conditions:[] },
    interpretation:{ carrier_screen_positive:[], cfDNA_interpretation:[] },
    explanation_hints:{},
  },
};

// ─── ANP scenarios ────────────────────────────────────────────────────────────
const ANP_SCENARIOS = {
  low_risk_twins_22q_rhd: {
    label:"Low Risk · Twins · 22q + RhD",
    report_meta:{ report_id:"UN-RPT-035-2605", date_reported:"2026-05-14" },
    patient:{ name:"Jane Doe", dob:"1901-01-01", sex:"Female", gestational_age:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"Menlo Park OB/GYN", address:"1035 O'Brien Dr., Suite 112, Menlo Park, CA 94025", phone:"650-460-2551" },
    summary:{
      overall_status:"low_risk", headline:"LOW RISK FETUS", gestation:"twin",
      fetal_sex:[{ label:"Twin A", sex:"female" }, { label:"Twin B", sex:"male" }],
      fetal_fraction_percent:10.3, zygosity:"dizygotic",
      follow_ups:[
        { type:"genetic_counseling", text:"Genetic counseling is available to review the implications of this result. Contact BillionToOne at (650) 460-2551 for a complimentary telephone genetic consultation." },
      ],
    },
    panels:[
      { id:"aneuploidy", title:"Unity Aneuploidy™ NIPT", subtitle:"Twin Gestation",
        conditions:[
          { id:"T21", name:"Trisomy 21",          status:"low_risk", risk_before:"1 in 311",   risk_after:"<1 in 10,000" },
          { id:"T18", name:"Trisomy 18",          status:"low_risk", risk_before:"1 in 980",   risk_after:"<1 in 10,000" },
          { id:"T13", name:"Trisomy 13",          status:"low_risk", risk_before:"1 in 2,735", risk_after:"<1 in 10,000" },
        ],
      },
      { id:"22q", title:"Unity 22q11.2 Microdeletion™ NIPT", subtitle:"Twin Gestation",
        conditions:[
          { id:"22Q", name:"22q11.2 Microdeletion", status:"low_risk", risk_before:"1 in 2,000", risk_after:"<1 in 10,000" },
        ],
      },
      { id:"rhd", title:"Unity Fetal RhD™ NIPT", subtitle:"Twin Gestation",
        conditions:[
          { id:"RHD", name:"Fetal RhD", status:"detected", label_override:"RhD: DETECTED", badge:"Rh+" },
        ],
      },
    ],
    interpretation:{
      aneuploidy:{ title:"The fetuses are LOW RISK to be affected with aneuploidy of chromosomes 13, 18 & 21.", body:"A low risk NIPT result significantly reduces the risk of the screened aneuploidies; it does not eliminate the risk. This result does not guarantee a normal pregnancy outcome." },
      "22q":{ title:"The fetuses are LOW RISK to be affected with 22q11.2 deletion syndrome.", body:"A low risk NIPT result significantly reduces the risk of a fetal 22q11.2 microdeletion; it does not eliminate the risk." },
      rhd:{ title:"The RHD gene was DETECTED in the cell-free DNA (RhD positive).", body:"NIPT was performed to determine the presence or absence of the RHD gene. The RHD gene was DETECTED in the cell-free DNA (RhD positive).\n\nIf the pregnant patient's blood type is RhD negative: This result indicates fetal RhD positive blood type. Anti-D prophylaxis is indicated for RhD negative patients who are not alloimmunized and carrying an RhD positive fetus.\n\nIf the pregnant patient's blood type is RhD positive: This result is not clinically relevant and could reflect either maternal or fetal RhD positive blood type. Anti-D prophylaxis is not indicated." },
    },
  },
  high_risk_t21_singleton: {
    label:"HIGH RISK · Trisomy 21 · Unity Confirm",
    report_meta:{ report_id:"UN-RPT-036-2605", date_reported:"2026-05-14" },
    patient:{ name:"Jane Doe", dob:"1901-01-01", sex:"Female", gestational_age:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"Menlo Park OB/GYN", address:"1035 O'Brien Dr., Suite 112, Menlo Park, CA 94025", phone:"650-460-2551" },
    summary:{
      overall_status:"high_risk", headline:"HIGH RISK Trisomy 21", gestation:"singleton",
      fetal_sex:[{ label:"Fetus", sex:"female" }], fetal_fraction_percent:7.0, zygosity:null,
      unity_confirm_eligible:true, unity_confirm_deadline:"06/10/2026",
      follow_ups:[
        { type:"unity_confirm",      text:"Unity Confirm for trisomy 21 can be considered. New blood draw must be collected by 06/10/2026.", urgent:true },
        { type:"prenatal_diagnosis", text:"Prenatal diagnosis via chorionic villus sampling or amniocentesis is recommended.", urgent:true },
        { type:"genetic_counseling", text:"Genetic counseling is recommended. Contact BillionToOne at (650) 460-2551 for a complimentary telephone genetic consultation.", urgent:false },
      ],
    },
    panels:[
      { id:"aneuploidy", title:"Unity Aneuploidy™ NIPT", subtitle:"Singleton Gestation",
        conditions:[
          { id:"T21", name:"Trisomy 21",       status:"high_risk",      risk_before:"1 in 140",   risk_after:"9 in 10"      },
          { id:"T18", name:"Trisomy 18",       status:"low_risk",       risk_before:"1 in 411",   risk_after:"<1 in 10,000" },
          { id:"T13", name:"Trisomy 13",       status:"low_risk",       risk_before:"1 in 1,233", risk_after:"<1 in 10,000" },
          { id:"MX",  name:"Monosomy X",       status:"low_risk",       risk_before:"1 in 250",   risk_after:"<1 in 10,000" },
          { id:"SCA", name:"Sex Chromosome Aneuploidy (XXX/XXY/XYY)", status:"not_detected_sca" },
        ],
      },
    ],
    interpretation:{
      aneuploidy:{ title:"The pregnancy is HIGH RISK for the fetus to be affected with TRISOMY 21.", body:"Prenatal diagnosis via chorionic villus sampling or amniocentesis is recommended. UNITY is not diagnostic. No irreversible decisions regarding the pregnancy should be made without confirmatory invasive prenatal testing. Genetic testing can also be performed postnatally." },
    },
  },
  low_risk_antigen: {
    label:"Low Risk + Big C Detected + Kell Not Detected",
    report_meta:{ report_id:"UN-RPT-037-2605", date_reported:"2026-05-14" },
    patient:{ name:"Jane Doe", dob:"1901-01-01", sex:"Female", gestational_age:{ weeks:10, days:2 }, mrn:"123456789" },
    provider:{ name:"Jill Smith, MD", clinic:"Menlo Park OB/GYN", address:"1035 O'Brien Dr., Suite 112, Menlo Park, CA 94025", phone:"650-460-2551" },
    summary:{
      overall_status:"antigen_detected", headline:"Big C Antigen: Detected", gestation:"singleton",
      fetal_sex:null, fetal_fraction_percent:9.6, zygosity:null,
      follow_ups:[
        { type:"surveillance",       text:"Appropriate clinical surveillance should be considered in the context of the patient's anti-C alloimmunization status.", urgent:true },
        { type:"genetic_counseling", text:"Genetic counseling is available. Contact BillionToOne at (650) 460-2551 for a complimentary consultation.", urgent:false },
      ],
    },
    panels:[
      { id:"antigen_c", title:"Unity Fetal Antigen™ NIPT", subtitle:"Big C (Red Blood Cell) Antigen",
        note:"The clinic reports the patient has anti-C alloimmunization. NIPT was performed to determine the presence or absence of the C red blood cell antigen.",
        conditions:[
          { id:"BIG_C", name:"Big C Antigen (Red Blood Cell)", status:"detected", label_override:"DETECTED", fetal_fraction_note:"9.6% fetal fraction" },
        ],
      },
      { id:"antigen_k", title:"Unity Fetal Antigen™ NIPT", subtitle:"K (Kell) Antigen (Red Blood Cell)",
        note:"The clinic reports the patient has anti-K (Kell) alloimmunization. NIPT was performed to determine the presence or absence of the K (Kell) red blood cell antigen.",
        conditions:[
          { id:"KELL", name:"K (Kell) Antigen (Red Blood Cell)", status:"not_detected", label_override:"NOT DETECTED", fetal_fraction_note:"9.6% fetal fraction" },
        ],
      },
    ],
    interpretation:{
      antigen_c:{ title:"Big C Antigen (Red Blood Cell): Detected", body:"Patients with anti-C alloimmunization carrying a fetus positive for the C antigen have a pregnancy at increased risk for hemolytic disease of the fetus and newborn (HDFN). These test results should be interpreted in conjunction with the patient's medical records and clinical presentation." },
      antigen_k:{ title:"K (Kell) Antigen (Red Blood Cell): Not Detected", body:"The K (Kell) antigen allele was NOT DETECTED in the cell-free DNA. These test results should be interpreted in conjunction with the patient's medical records and clinical presentation, and appropriate clinical surveillance should be considered in this context." },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gaStr    = ga  => `${ga.weeks}w ${ga.days}d`;
const fmtDate  = iso => { try { return new Date(iso+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); } catch { return iso; } };
const panelLabel = { acog_guideline:"ACOG Guideline Panel", plus_panel:"Plus Panel", fragile_x:"Fragile X" };
const recIcon    = { cardiology_eval:"❤️", prenatal_diagnosis:"🔬", genetic_counseling:"💬", other:"ℹ️" };
const ANP_FU_ICONS = { prenatal_diagnosis:"🔬", genetic_counseling:"💬", unity_confirm:"🧬", surveillance:"🩺", redraw:"🔄", other:"ℹ️" };

function getFetalRisk(report, cid) { return report.cfDNA_assessment?.conditions?.find(c=>c.condition_id===cid)||null; }
function getStaticKey(report, condition) {
  // no_call and qc_fail statuses always use the generic no-call content
  if (condition.carrier_status==="no_call"||condition.carrier_status==="qc_fail") return "__NO_CALL__";
  // Manual override map (e.g. SMN_SILENT_CARRIER scenario)
  const override = (report.static_explanation_map||{})[condition.condition_id];
  if (override) return override;
  // Try compound key: CONDITION_ID__CARRIER_PROFILE_CODE (e.g. "SICKLE_CELL__POSITIVE_HBS")
  if (condition.carrier_profile_code) {
    const compound = `${condition.condition_id}__${condition.carrier_profile_code}`;
    if (STATIC_EXPLANATIONS[compound]) return compound;
  }
  // Fall back to bare profile code for shared codes (e.g. "SMN_1CN_CARRIER", "NEG_PSEUDO")
  if (condition.carrier_profile_code && STATIC_EXPLANATIONS[condition.carrier_profile_code]) {
    return condition.carrier_profile_code;
  }
  // Last resort: bare carrier_status as a shared key
  if (condition.carrier_status && STATIC_EXPLANATIONS[condition.carrier_status?.toUpperCase()]) {
    return condition.carrier_status.toUpperCase();
  }
  return null;
}

// ─── AI fetchers ──────────────────────────────────────────────────────────────
async function fetchExplanation(condition, report) {
  const hints=report.explanation_hints?.[condition.condition_id];
  const interp=report.interpretation?.carrier_screen_positive?.find(c=>c.condition_id===condition.condition_id);
  const cfInterp=report.interpretation?.cfDNA_interpretation?.find(c=>c.condition_id===condition.condition_id);
  const fr=getFetalRisk(report,condition.condition_id);
  const sys=`You are a plain-language genetic counseling assistant for Unity Screen. Explain genetic screening results to pregnant patients warmly and clearly. Short sentences. Respond ONLY with JSON (no markdown):
{"summary":"2-3 sentence plain summary","sections":[{"label":"title","body":"paragraph"}],"stats":[{"val":"value","label":"description"}],"action":{"label":"button label","type":"cardiology_eval|genetic_counseling|prenatal_diagnosis|null"}}
stats: 0-3 items. action.type can be null.`;
  const user=`Condition: ${condition.condition_name} (${condition.gene_symbols.join(", ")})
Carrier status: ${condition.carrier_status}
${condition.variant_detail?`Variant: ${condition.variant_detail.variant_name} (${condition.variant_detail.variant_class})`:""}
${hints?`Hints: ${JSON.stringify(hints)}`:""}
${interp?`Clinical text: ${interp.clinical_text}`:""}
${cfInterp?`Fetal risk text: ${cfInterp.clinical_text}`:""}
${fr?`Fetal risk: ${fr.fetal_risk_status}${fr.fetal_risk_percent?`, ${fr.fetal_risk_percent}%`:""}`:""}
${fr?.risk_before_cfDNA?`Risk before cfDNA: ${fr.risk_before_cfDNA}, after: ${fr.risk_after_cfDNA}`:""}`;
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:user}]})});
  const data=await res.json();
  try{return JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());}catch{return null;}
}

async function fetchFFExpl(value) {
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,
      system:`Explain fetal fraction to a patient warmly. Respond ONLY with JSON: {"summary":"2-3 sentences","sections":[{"label":"title","body":"text"}],"stats":[{"val":"value","label":"description"}]}`,
      messages:[{role:"user",content:`Fetal fraction is ${value}%. Minimum needed: 4%. Gestational age: ~10 weeks.`}]})});
  const data=await res.json();
  try{return JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());}catch{return null;}
}

async function fetchANPExplanation(condition, panel, report) {
  const sys=`You are a plain-language genetic counseling assistant for Unity Screen by BillionToOne. Explain prenatal NIPT screening results to pregnant patients warmly and clearly. Short sentences. Respond ONLY with valid JSON (no markdown):
{"summary":"2-3 sentence plain summary","sections":[{"label":"Section title","body":"Paragraph text"}],"stats":[{"val":"number or short value","label":"description"}],"action":{"label":"Button label","type":"genetic_counseling|prenatal_diagnosis|null"}}
Maximum 3 sections. 0-2 stats. action.type may be null.`;
  const user=`Test panel: ${panel.title}
Condition: ${condition.name}
Result: ${condition.status}
${condition.risk_before?`Risk before NIPT: ${condition.risk_before}`:""}
${condition.risk_after?`Risk after NIPT: ${condition.risk_after}`:""}
${condition.label_override?`Result label: ${condition.label_override}`:""}
Gestation: ${report.summary.gestation}
${report.interpretation?.[panel.id]?.title?`Clinical interpretation: ${report.interpretation[panel.id].title}`:""}
${report.interpretation?.[panel.id]?.body?`Details: ${report.interpretation[panel.id].body}`:""}`;
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:user}]})});
  const data=await res.json();
  try{return JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());}catch{return null;}
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Dots() {
  return (
    <div style={{display:"flex",gap:4,alignItems:"center",padding:"16px 0"}}>
      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.aqua,animation:`bounce 1s ${i*0.2}s infinite ease-in-out`}}/>)}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}
function LegalFooter({style={}}) {
  return (
    <div style={{borderTop:`0.5px solid ${T.border}`,padding:"10px 0 4px",...style}}>
      <p style={{fontSize:10,color:T.textMuted,margin:0,lineHeight:1.6,opacity:0.8}}>{LEGAL_TEXT}</p>
    </div>
  );
}
function AINote() {
  return (
    <div style={{display:"flex",gap:8,alignItems:"flex-start",paddingTop:10,borderTop:`0.5px solid ${T.border}`,marginTop:4}}>
      <span style={{fontSize:10,background:T.gray,color:T.textMuted,padding:"2px 6px",borderRadius:4,flexShrink:0,marginTop:1}}>AI</span>
      <p style={{fontSize:11,color:T.textMuted,margin:0,lineHeight:1.5}}>AI-generated for educational purposes. Always discuss results with your provider.</p>
    </div>
  );
}
function DNATwist({size=22}) {
  return (
    <svg width={size} height={size*1.4} viewBox="0 0 48 68" fill="none" aria-hidden="true">
      <path d="M14 4C14 4 34 16 34 34C34 52 14 64 14 64" stroke="rgba(255,255,255,0.9)" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M34 4C34 4 14 16 14 34C14 52 34 64 34 64" stroke={T.aqua} strokeWidth="10" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function UnityLogo({height=28}) {
  const w=Math.round(height*456/103);
  return (
    <svg width={w} height={height} viewBox="0 0 456 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Unity logo">
      <path d="M65.5828 0V61.43C65.5828 68.7715 64.0566 74.0145 61.0377 77.0057C58.0055 80.0103 53.2473 81.5359 46.8896 81.5359C42.7111 81.5359 39.219 80.8564 36.5 79.5173C33.8543 78.2182 31.8151 76.0731 30.4489 73.1418C29.0427 70.1439 28.3363 66.1067 28.3363 61.1369V0H0V61.8231C0 70.9966 1.90597 78.7445 5.65794 84.8469C9.41657 90.9626 14.8413 95.5793 21.7721 98.5572C28.6296 101.508 36.8466 103.001 46.1832 103.001C55.5198 103.001 63.6168 101.608 70.5743 98.857C77.5984 96.079 83.163 91.6421 87.1282 85.673C91.0868 79.7105 93.0927 72.0759 93.0927 62.9889V0H65.5894H65.5828Z" fill="white"/>
      <path d="M176.918 0V67.0461L141.617 0H104.384V99.2967H129.249V26.921L169.214 99.2967H201.929V0H176.918Z" fill="white"/>
      <path d="M233.062 65.1476C231.895 67.1527 231.282 69.431 231.282 71.7491V99.3038H249.936V66.8732C249.936 61.5504 248.317 56.354 245.298 51.9572V51.9503L243.716 49.6486L233.062 65.1476ZM212.629 32.4308C212.629 37.7536 214.249 42.95 217.268 47.3468L218.851 49.6486L229.503 34.1495C230.669 32.1443 231.282 29.8654 231.282 27.547V0.00012207H212.629V32.4308Z" fill="white"/>
      <path d="M258.107 0V22.3975H290.649V100.296H318.272V22.3975H350.814V0H258.107Z" fill="#52C2CF"/>
      <path d="M427.897 0.00012207L406.978 41.6841L386.192 0.00012207H355.037L391.85 65.6205V100.296H419.04V65.6205L455.7 0.00012207H427.897Z" fill="#52C2CF"/>
      <path d="M217.285 51.9501L229.521 34.1493C230.687 32.144 231.3 29.8656 231.3 27.5473V0H249.953V32.4305C249.953 37.7534 248.334 42.9497 245.315 47.3466L233.08 65.1474C231.913 67.1527 231.3 69.4311 231.3 71.7494V99.3033H212.647V66.8729C212.647 61.5499 214.266 56.3536 217.285 51.9567V51.9501Z" fill="#52C2CF"/>
    </svg>
  );
}
function BubbleIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block",verticalAlign:"middle"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#bubble_clip)">
        <mask id="bubble_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="12" width="36" height="36"><path d="M47.4287 12.9285H12.9287V47.4285H47.4287V12.9285Z" fill="white"/></mask>
        <g mask="url(#bubble_m0)">
          <path opacity="0.66" d="M44.5537 36.1681H42.1579V19.3972C42.1579 18.736 41.6212 18.1993 40.96 18.1993H23.71V15.8035H40.96C42.9437 15.8035 44.5537 17.4135 44.5537 19.3972V36.1681Z" fill="white"/>
          <path opacity="0.66" d="M33.7726 33.7721H26.5851V30.7773H23.5903V23.5898H26.5851V20.595H33.7726V23.5898H36.7674V30.7773H33.7726V33.7721ZM28.981 31.3762H31.3768V28.3814H34.3716V25.9856H31.3768V22.9908H28.981V25.9856H25.9862V28.3814H28.981V31.3762Z" fill="white"/>
          <path d="M37.3662 43.4035L30.7058 36.1681H19.3975C18.7362 36.1681 18.1995 35.6314 18.1995 34.9701V19.3972C18.1995 18.736 18.7362 18.1993 19.3975 18.1993H23.71V15.8035H19.3975C17.4137 15.8035 15.8037 17.4135 15.8037 19.3972V34.9701C15.8037 36.9539 17.4137 38.5639 19.3975 38.5639H29.6516L35.6029 45.0231C36.0677 45.5262 36.705 45.7993 37.3614 45.7993C37.6537 45.7993 37.9508 45.7466 38.2383 45.6316C39.1631 45.2722 39.762 44.3953 39.762 43.3987V36.1633H37.3662V43.3987V43.4035Z" fill="white"/>
        </g>
      </g>
      <defs><clipPath id="bubble_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.9287 12.9285)"/></clipPath></defs>
    </svg>
  );
}
function CarrierStatusBadge({status,small}) {
  const cfg=STATUS_CFG[status]||{label:status,color:T.textMuted,bg:T.gray};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:small?11:12,fontWeight:600,color:cfg.color,background:cfg.bg,padding:small?"2px 7px":"3px 8px",borderRadius:12,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>{cfg.label}
    </span>
  );
}
function ANPIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#anp_clip)">
        <mask id="anp_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="12" width="36" height="36"><path d="M47.4287 12.9285H12.9287V47.4285H47.4287V12.9285Z" fill="white"/></mask>
        <g mask="url(#anp_m0)">
          <path opacity="0.66" d="M38.085 21.3522V15.8035H35.6891V21.3522C35.6891 22.9095 35.0854 24.3949 34.1175 25.2287L30.1787 28.602V31.7597L34.1175 35.1331C35.0902 35.9668 35.6891 37.4474 35.6891 39.0095V44.5583H38.085V39.0095C38.085 36.7383 37.1841 34.6108 35.6748 33.317L32.0187 30.1833L35.6748 27.0495C37.1841 25.7558 38.085 23.6283 38.085 21.357" fill="white"/>
          <path d="M30.1787 28.602L26.24 25.2287C25.2673 24.3949 24.6683 22.9143 24.6683 21.3522V15.8035H22.2725V21.3522C22.2725 23.6235 23.1733 25.751 24.6827 27.0447L28.3387 30.1785L24.6827 33.3122C23.1733 34.606 22.2725 36.7335 22.2725 39.0047V44.5535H24.6683V39.0047C24.6683 37.4474 25.272 35.962 26.24 35.1283L30.1787 31.7549V28.5972V28.602Z" fill="white"/>
        </g>
      </g>
      <defs><clipPath id="anp_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.9287 12.9285)"/></clipPath></defs>
    </svg>
  );
}
function CarrierIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#carrier_clip)">
        <mask id="carrier_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="12" width="36" height="36"><path d="M47.4287 12.9285H12.9287V47.4285H47.4287V12.9285Z" fill="white"/></mask>
        <g mask="url(#carrier_m0)">
          <path opacity="0.66" d="M35.6866 28.9805H23.8633V31.3763H35.6866V28.9805Z" fill="white"/>
          <path opacity="0.66" d="M38.0854 30.1785H35.6895V29.1866C35.6895 27.9264 34.942 26.7908 33.7776 26.2972L25.6366 22.8281C23.5906 21.956 22.2681 19.9578 22.2681 17.7345V15.8035H24.6639V17.7345C24.6639 18.9947 25.4162 20.1303 26.5758 20.6239L34.712 24.0931C36.7581 24.9651 38.0806 26.9633 38.0806 29.1866V30.1785H38.0854Z" fill="white"/>
          <path d="M24.6688 30.1785H22.2729V29.1866C22.2729 26.9633 23.5954 24.9651 25.6415 24.0931L33.7825 20.6239C34.9421 20.1303 35.6944 18.9947 35.6944 17.7345V15.8035H38.0902V17.7345C38.0902 19.9578 36.7677 21.956 34.7217 22.8281L26.5807 26.2972C25.4211 26.7908 24.6688 27.9264 24.6688 29.1866V30.1785Z" fill="white"/>
          <path d="M34.7173 37.5291C36.7631 38.4012 38.0854 40.3997 38.0854 42.6277V44.5535H35.6899V42.6277C35.6899 41.3675 34.9421 40.2315 33.7778 39.7332L30.1782 38.199L33.2339 36.8962L34.7173 37.5291ZM24.6636 31.1707C24.6637 32.4307 25.4163 33.5658 26.5757 34.0593L30.1792 35.5945L27.1235 36.8972L25.6362 36.2634C23.5906 35.3913 22.2682 33.3937 22.2681 31.1707V30.1785H24.6636V31.1707Z" fill="white"/>
        </g>
        <path opacity="0.66" d="M24.6659 44.5535H22.27V42.6272C22.27 40.4039 23.5925 38.401 25.6386 37.5289L33.7796 34.0597C34.9392 33.5662 35.6915 32.4306 35.6915 31.1703V30.1785H38.0873V31.1703C38.0873 33.3937 36.7648 35.3918 34.7188 36.2639L26.5777 39.733C25.4181 40.2266 24.6659 41.3622 24.6659 42.6272V44.5535Z" fill="white"/>
      </g>
      <defs><clipPath id="carrier_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.9287 12.9285)"/></clipPath></defs>
    </svg>
  );
}
function CustomerServiceIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#cs_clip)">
        <mask id="cs_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="13" width="36" height="35"><path d="M47.2817 13.3574H12.7817V47.8574H47.2817V13.3574Z" fill="white"/></mask>
        <g mask="url(#cs_m0)">
          <path opacity="0.66" d="M30.6307 21.0239C28.3163 21.0239 26.438 22.9023 26.438 25.2166H28.8338C28.8338 24.2248 29.6388 23.4198 30.6307 23.4198C31.6226 23.4198 32.4276 24.2248 32.4276 25.2166C32.4276 25.6862 32.2024 26.1318 31.8286 26.4146L30.3911 27.4927C29.4184 28.2258 28.8338 29.3902 28.8338 30.6073H31.2297C31.2297 30.1377 31.4549 29.6921 31.8286 29.4093L33.2661 28.3312C34.2388 27.5981 34.8234 26.4337 34.8234 25.2166C34.8234 22.9023 32.9451 21.0239 30.6307 21.0239Z" fill="white"/>
          <path opacity="0.66" d="M31.2298 31.8052H28.834V34.201H31.2298V31.8052Z" fill="white"/>
          <path opacity="0.66" d="M44.4067 36.597H42.0109V19.8262C42.0109 19.1649 41.4742 18.6283 40.813 18.6283H23.563V16.2324H40.813C42.7967 16.2324 44.4067 17.8424 44.4067 19.8262V36.597Z" fill="white"/>
          <path d="M37.2192 43.8324L30.5588 36.597H19.2505C18.5892 36.597 18.0526 36.0603 18.0526 35.3991V19.8262C18.0526 19.1649 18.5892 18.6283 19.2505 18.6283H23.563V16.2324H19.2505C17.2667 16.2324 15.6567 17.8424 15.6567 19.8262V35.3991C15.6567 37.3828 17.2667 38.9928 19.2505 38.9928H29.5047L35.4559 45.452C35.9207 45.9551 36.558 46.2283 37.2144 46.2283C37.5067 46.2283 37.8038 46.1755 38.0913 46.0605C39.0161 45.7012 39.6151 44.8243 39.6151 43.8276V36.5922H37.2192V43.8276V43.8324Z" fill="white"/>
        </g>
      </g>
      <defs><clipPath id="cs_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.7817 13.3574)"/></clipPath></defs>
    </svg>
  );
}
function PNDIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#pnd_clip)">
        <mask id="pnd_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="13" width="36" height="35"><path d="M47.2817 13.3574H12.7817V47.8574H47.2817V13.3574Z" fill="white"/></mask>
        <g mask="url(#pnd_m0)">
          <path opacity="0.66" d="M27.8259 27.7336L26.1318 29.4277L31.2142 34.5101L32.9083 32.816L27.8259 27.7336Z" fill="white"/>
          <mask id="pnd_m2" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="13" width="36" height="35"><path d="M47.2817 13.3574H12.7817V47.8574H47.2817V13.3574Z" fill="white"/></mask>
          <g mask="url(#pnd_m2)">
            <path d="M42.7393 28.0675L44.4307 26.376L41.8911 23.8364L36.8072 18.7525L34.2676 16.2129L32.5761 17.9091L35.1157 20.4487L33.4195 22.145L32.5714 21.2968L30.8751 19.6054L29.1836 21.2968L30.8799 22.9931L18.1724 35.7006C16.5959 37.2771 16.3564 39.6825 17.4393 41.5177L15.6328 43.3241L17.3243 45.0156L19.1307 43.2091C19.8782 43.65 20.7168 43.8752 21.5601 43.8752C22.7868 43.8752 24.0134 43.4104 24.9478 42.476L37.6553 29.7685L39.3516 31.4648L41.043 29.7685L39.3468 28.0723L38.4986 27.2241L40.1901 25.5279L42.7297 28.0675H42.7393ZM23.2564 40.7702C22.8059 41.2206 22.2022 41.4698 21.5601 41.4698C20.918 41.4698 20.3191 41.2206 19.8686 40.7702C18.9343 39.8358 18.9343 38.3169 19.8686 37.3825L32.5761 24.675L35.9639 28.0627L23.2564 40.7702ZM36.8072 25.5231L35.1157 23.8316L36.8072 22.1354L38.5034 23.8268L36.8072 25.5231Z" fill="white"/>
          </g>
        </g>
      </g>
      <defs><clipPath id="pnd_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.7817 13.3574)"/></clipPath></defs>
    </svg>
  );
}
function UnityConfirmIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#uc_clip)">
        <path opacity="0.66" d="M39.6027 44.9727H20.436C18.4523 44.9727 16.8423 43.3627 16.8423 41.3789V19.8164C16.8423 17.8327 18.4523 16.2227 20.436 16.2227H39.6027C41.5865 16.2227 43.1965 17.8327 43.1965 19.8164V41.3789C43.1965 43.3627 41.5865 44.9727 39.6027 44.9727ZM20.436 18.6185C19.7748 18.6185 19.2381 19.1552 19.2381 19.8164V41.3789C19.2381 42.0402 19.7748 42.5768 20.436 42.5768H39.6027C40.264 42.5768 40.8006 42.0402 40.8006 41.3789V19.8164C40.8006 19.1552 40.264 18.6185 39.6027 18.6185H20.436Z" fill="white"/>
        <path d="M37.7865 24.6035H28.2031V26.9993H37.7865V24.6035Z" fill="white"/>
        <path d="M37.7865 29.3955H28.2031V31.7913H37.7865V29.3955Z" fill="white"/>
        <path d="M37.7865 34.1875H28.2031V36.5833H37.7865V34.1875Z" fill="white"/>
        <path d="M25.2703 34.1875H22.8745V36.5833H25.2703V34.1875Z" fill="white"/>
        <path d="M25.2703 24.6035H22.8745V32.9889H25.2703V24.6035Z" fill="white"/>
      </g>
      <defs><clipPath id="uc_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.769 13.3477)"/></clipPath></defs>
    </svg>
  );
}
function RhDIcon({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink:0,display:"inline-block"}}>
      <rect width="60.3571" height="60.3571" rx="30.1786" fill="#084153"/>
      <g clipPath="url(#rhd_clip)">
        <mask id="rhd_m0" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="12" y="12" width="36" height="36"><path d="M47.4287 12.9287H12.9287V47.4287H47.4287V12.9287Z" fill="white"/></mask>
        <g mask="url(#rhd_m0)">
          <path opacity="0.66" d="M29.2779 28.7845L27.9793 27.486C26.2831 25.7897 25.387 23.8203 25.387 21.7935H22.9912C22.9912 24.4672 24.1316 27.0212 26.2879 29.1774L27.5864 30.476C29.2827 32.1722 30.1787 34.1416 30.1787 36.1685C30.1787 39.4699 27.4906 42.158 24.1891 42.158V44.5539C28.8131 44.5539 32.5745 40.7924 32.5745 36.1685C32.5745 33.4947 31.4341 30.9407 29.2779 28.7845Z" fill="white"/>
          <path d="M18.1995 36.1685C18.1995 34.1416 19.0956 32.1722 20.7918 30.476L22.0904 29.1774C24.2466 27.0212 25.387 24.4672 25.387 21.7935H22.9912C22.9912 23.8203 22.0952 25.7897 20.3989 27.486L19.1004 28.7845C16.9441 30.9407 15.8037 33.4947 15.8037 36.1685C15.8037 40.7924 19.5652 44.5539 24.1891 44.5539V42.158C20.8877 42.158 18.1995 39.4699 18.1995 36.1685Z" fill="white"/>
          <path d="M44.5537 30.1787H33.7725V32.5745H44.5537V30.1787Z" fill="white"/>
          <path d="M44.5537 19.9964H40.361V15.8037H37.9652V19.9964H33.7725V22.3923H37.9652V26.585H40.361V22.3923H44.5537V19.9964Z" fill="white"/>
        </g>
      </g>
      <defs><clipPath id="rhd_clip"><rect width="34.5" height="34.5" fill="white" transform="translate(12.9287 12.9287)"/></clipPath></defs>
    </svg>
  );
}
function ANPStatusBadge({status,label_override,size="normal"}) {
  const notSca=status==="not_detected_sca";
  const cfg=notSca?{label:"Not Detected",color:"#1E7A38",bg:"#F0FAF3",icon:"✓"}:ANP_STATUS[status]||{label:status,color:T.textMuted,bg:T.gray,icon:"–"};
  const label=label_override||cfg.label;
  const fs=size==="sm"?11:13; const px=size==="sm"?"6px 10px":"5px 12px";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.color,fontSize:fs,fontWeight:600,padding:px,borderRadius:20,border:`1px solid ${cfg.color}22`,whiteSpace:"nowrap",letterSpacing:status==="high_risk"?"0.4px":"0"}}>
      <span style={{fontSize:fs-1}}>{cfg.icon}</span>{label}
    </span>
  );
}

// ─── Carrier content components ───────────────────────────────────────────────
function EthnicityTable({rows}) {
  return (
    <div style={{marginTop:4,borderRadius:8,overflow:"hidden",border:`0.5px solid ${T.border}`}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 90px 120px",background:T.gray,padding:"6px 10px"}}>
        {["Ethnicity","Pre-screen","Post-screen (SNP+)"].map(h=>(
          <span key={h} style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.4px"}}>{h}</span>
        ))}
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 120px",padding:"7px 10px",background:i%2===0?"white":"#FAFAFA",borderTop:`0.5px solid ${T.border}`}}>
          <span style={{fontSize:12,color:T.softBlack}}>{r.ethnicity}</span>
          <span style={{fontSize:12,color:T.textMuted}}>{r.pretest}</span>
          <span style={{fontSize:12,color:r.posttest==="Likely Carrier"?"#6B3A9E":T.softBlack,fontWeight:r.posttest==="Likely Carrier"?600:400}}>{r.posttest}</span>
        </div>
      ))}
    </div>
  );
}
function CordBloodCard() {
  return (
    <div style={{background:"linear-gradient(135deg,#084153,#0A5A74)",borderRadius:10,padding:"14px 16px",border:"0.5px solid rgba(82,194,207,0.3)"}}>
      <div style={{display:"flex",gap:10,marginBottom:10}}>
        <span style={{fontSize:20,flexShrink:0}}>🩸</span>
        <div>
          <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 3px"}}>Cord Blood Banking — Covered for You</p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.55}}>Because your baby's fetal risk result is high, BillionToOne will cover cord blood collection and first-year storage at no cost.</p>
        </div>
      </div>
      <button style={{width:"100%",background:T.aqua,border:"none",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:600,color:T.navy,cursor:"pointer"}}>Learn about cord blood banking →</button>
    </div>
  );
}
// ─── Video Card ───────────────────────────────────────────────────────────────
// Renders a tappable thumbnail card that expands inline to a portrait Vimeo player.
// videoId: Vimeo video ID string. title: label shown on card and above player.
function VideoCard({ videoId, title }) {
  const [expanded, setExpanded] = useState(false);
  if (!videoId) return null;

  const thumbUrl = `https://vumbnail.com/${videoId}.jpg`;

  return (
    <div style={{ borderRadius:12, overflow:"hidden", border:`0.5px solid ${T.border}`, background:"white" }}>
      {!expanded ? (
        /* ── Thumbnail / collapsed state ── */
        <button
          onClick={() => setExpanded(true)}
          style={{
            width:"100%", background:"none", border:"none", cursor:"pointer",
            padding:0, display:"block", textAlign:"left",
          }}
          aria-label={`Play video: ${title}`}
        >
          {/* Thumbnail image area */}
          <div style={{ position:"relative", width:"100%", aspectRatio:"9/5", background:T.navy, overflow:"hidden" }}>
            <img
              src={thumbUrl}
              alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.82 }}
              onError={e => { e.target.style.display = "none"; }}
            />
            {/* Dark gradient overlay */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to bottom, rgba(2,38,51,0.3) 0%, rgba(2,38,51,0.55) 100%)",
            }}/>
            {/* Play button */}
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <div style={{
                width:52, height:52, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)",
                backdropFilter:"blur(4px)",
                border:"2px solid rgba(255,255,255,0.55)",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"transform 0.15s",
              }}>
                {/* SVG play triangle */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3L17 10L5 17V3Z" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
          {/* Card footer */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", gap:10,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                fontSize:10, fontWeight:700, color:T.aqua,
                background:T.sky, padding:"2px 7px", borderRadius:4,
                letterSpacing:"0.5px", textTransform:"uppercase", flexShrink:0,
              }}>VIDEO</span>
              <span style={{ fontSize:12, fontWeight:600, color:T.dark, lineHeight:1.35 }}>{title}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
              <circle cx="8" cy="8" r="7.5" stroke={T.aqua} strokeWidth="1"/>
              <path d="M6 5l4 3-4 3V5z" fill={T.aqua}/>
            </svg>
          </div>
        </button>
      ) : (
        /* ── Expanded player state ── */
        <div>
          {/* Header row with close */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px 8px", borderBottom:`0.5px solid ${T.border}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                fontSize:10, fontWeight:700, color:T.aqua,
                background:T.sky, padding:"2px 7px", borderRadius:4,
                letterSpacing:"0.5px", textTransform:"uppercase",
              }}>VIDEO</span>
              <span style={{ fontSize:12, fontWeight:600, color:T.dark }}>{title}</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background:T.gray, border:"none", borderRadius:"50%",
                width:26, height:26, cursor:"pointer",
                fontSize:14, color:T.textMuted, display:"flex",
                alignItems:"center", justifyContent:"center", flexShrink:0,
              }}
              aria-label="Close video"
            >×</button>
          </div>
          {/* Portrait video embed — Vimeo player */}
          <div style={{ padding:"0 14px 14px" }}>
            <div style={{
              position:"relative", paddingTop:"177.78%", /* 9:16 portrait */
              background:T.navy, borderRadius:8, overflow:"hidden", marginTop:10,
            }}>
              <iframe
                src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1`}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}
                title={title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Info Sheet Panel ─────────────────────────────────────────────────────────
const RISK_COLORS = {
  high_risk:      { bg:"#FFF0ED", border:"#F45B3D44", titleColor:"#C03E20", bodyColor:"#803020", badgeBg:"#FFF0ED", badgeColor:T.orange },
  low_risk:       { bg:"#F0FAF3", border:"#1E7A3833", titleColor:"#1E7A38", bodyColor:"#1E5C2A", badgeBg:"#F0FAF3", badgeColor:"#1E7A38" },
  increased_risk: { bg:"#FFF7ED", border:"#FFB54544", titleColor:"#A05500", bodyColor:"#7A3E00", badgeBg:"#FFF7ED", badgeColor:"#A05500" },
  decreased_risk: { bg:"#FFF7ED", border:"#FFB54544", titleColor:"#A05500", bodyColor:"#7A3E00", badgeBg:"#FFF7ED", badgeColor:"#A05500" },
  snp_present:    { bg:"#F5F0FF", border:"#6B3A9E33", titleColor:"#6B3A9E", bodyColor:"#4A2870", badgeBg:"#F5F0FF", badgeColor:"#6B3A9E" },
};

function InfoSheetPanel({ sheet, mobile=false }) {
  if (!sheet) return (
    <div style={{padding:"20px 0",textAlign:"center"}}>
      <p style={{fontSize:13,color:T.textMuted}}>No info sheet available for this result.</p>
    </div>
  );
  const riskCfg = RISK_COLORS[sheet.headlineRisk] || RISK_COLORS.low_risk;
  const pad = mobile ? "10px 14px" : "12px 16px";
  const bodyFs = mobile ? 12 : 13;
  const titleFs = mobile ? 13 : 14;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Your status */}
      <div style={{background:T.sky,borderRadius:10,padding:pad,border:`0.5px solid ${T.lightAqua}`}}>
        <p style={{fontSize:10,fontWeight:600,color:T.dark,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 5px",opacity:0.7}}>Your status</p>
        <p style={{fontSize:titleFs,fontWeight:600,color:T.dark,margin:"0 0 5px",lineHeight:1.3}}>{sheet.yourStatus.title}</p>
        <p style={{fontSize:bodyFs,color:T.softBlack,margin:"0 0 5px",lineHeight:1.6}}>{sheet.yourStatus.body}</p>
        {sheet.yourStatus.detail&&<p style={{fontSize:10,color:T.textMuted,margin:0,fontFamily:"monospace",lineHeight:1.4}}>{sheet.yourStatus.detail}</p>}
      </div>

      {/* Fetal risk */}
      <div style={{background:riskCfg.bg,borderRadius:10,padding:pad,border:`0.5px solid ${riskCfg.border}`}}>
        <p style={{fontSize:10,fontWeight:600,color:riskCfg.titleColor,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 5px",opacity:0.8}}>Your baby</p>
        <p style={{fontSize:titleFs,fontWeight:600,color:riskCfg.titleColor,margin:"0 0 5px",lineHeight:1.3}}>{sheet.fetalRisk.title}</p>
        <p style={{fontSize:bodyFs,color:riskCfg.bodyColor,margin:0,lineHeight:1.6}}>{sheet.fetalRisk.body}</p>
      </div>

      {/* Important banner */}
      {sheet.important&&(
        <div style={{background:"#FFFBEB",border:"0.5px solid #FFB54566",borderRadius:10,padding:pad,display:"flex",gap:10}}>
          <span style={{fontSize:16,flexShrink:0,lineHeight:1}}>⚠️</span>
          <div>
            <p style={{fontSize:10,fontWeight:700,color:"#A05500",textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 3px"}}>Important</p>
            <p style={{fontSize:bodyFs-1,color:"#7A3E00",margin:0,lineHeight:1.55}}>{sheet.important}</p>
          </div>
        </div>
      )}

      {/* Disease education */}
      {sheet.disease&&(
        <div style={{background:T.beige,borderRadius:10,padding:pad}}>
          <p style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 3px"}}>{sheet.disease.title}</p>
          <p style={{fontSize:titleFs-1,fontWeight:600,color:T.dark,margin:"0 0 6px",lineHeight:1.35}}>{sheet.disease.subtitle}</p>
          <p style={{fontSize:bodyFs,color:T.softBlack,margin:0,lineHeight:1.65}}>{sheet.disease.body}</p>
        </div>
      )}

      {/* Ancestry / ethnicity table for SMN1 SNP */}
      {sheet.ethnicityTable&&(
        <div style={{borderRadius:8,overflow:"hidden",border:`0.5px solid ${T.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 90px",background:T.navy,padding:"7px 10px"}}>
            {["Ancestry","Silent carrier risk","Paternal freq.","Fetal risk"].map(h=>(
              <span key={h} style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.3px"}}>{h}</span>
            ))}
          </div>
          {sheet.ethnicityTable.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 90px",padding:"7px 10px",background:i%2===0?"white":"#FAFAFA",borderTop:`0.5px solid ${T.border}`}}>
              <span style={{fontSize:11,color:T.softBlack,fontWeight:r.ancestry==="Ashkenazi Jewish"?600:400}}>{r.ancestry}</span>
              <span style={{fontSize:11,color:r.silentCarrierRisk==="Likely carrier"?"#6B3A9E":T.textMuted,fontWeight:r.silentCarrierRisk==="Likely carrier"?600:400}}>{r.silentCarrierRisk}</span>
              <span style={{fontSize:11,color:T.textMuted}}>{r.paternalFreq}</span>
              <span style={{fontSize:11,color:T.textMuted}}>{r.fetalRisk}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next steps */}
      {sheet.nextSteps&&sheet.nextSteps.length>0&&(
        <div style={{background:"white",borderRadius:10,border:`0.5px solid ${T.border}`,overflow:"hidden"}}>
          <div style={{background:T.dark,padding:"7px 14px"}}>
            <p style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.5px",margin:0}}>Next steps</p>
          </div>
          {sheet.nextSteps.map((step,i)=>(
            <div key={i} style={{padding:"11px 14px",borderBottom:i<sheet.nextSteps.length-1?`0.5px solid ${T.border}`:"none",display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:13,fontWeight:700,color:T.aqua,flexShrink:0,lineHeight:1.5,minWidth:20}}>{step.n}</span>
              <div>
                <p style={{fontSize:bodyFs,fontWeight:600,color:T.dark,margin:"0 0 3px",lineHeight:1.3}}>{step.label}</p>
                <p style={{fontSize:bodyFs-1,color:T.textMuted,margin:0,lineHeight:1.55}}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resources */}
      {sheet.resources&&sheet.resources.length>0&&(
        <div>
          <p style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 6px"}}>Trusted resources</p>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {sheet.resources.map((r,i)=>(
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"white",border:`0.5px solid ${T.border}`,borderRadius:8,textDecoration:"none",fontSize:12,color:T.dark,fontWeight:500}}>
                {r.label}<span style={{fontSize:11,color:T.aqua}}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CarrierExplContent({expl,condition,report}) {
  const fr=condition?getFetalRisk(report,condition.condition_id):null;
  const showCord=fr?.cord_blood_banking&&fr?.fetal_risk_status==="high_risk";

  // Derive video from cfDNA profile code (e.g. "lowrisk") or static explanation key.
  // When wired to the real API, cfDNA_profile_code will come directly from the pipeline response.
  const cfDNACode = fr?.cfDNA_profile_code || null;
  // Also check for a carrier-level video (e.g. SMN_SILENT_CARRIER keyed by static_explanation_map)
  const staticKey = condition && report ? getStaticKey(report, condition) : null;
  const videoEntry = (cfDNACode && VIDEO_MAP[cfDNACode])
    ? VIDEO_MAP[cfDNACode]
    : (staticKey && VIDEO_MAP[staticKey])
    ? VIDEO_MAP[staticKey]
    : null;

  if(!expl) return <Dots/>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {expl.summary&&<div style={{background:T.sky,borderLeft:`3px solid ${T.aqua}`,padding:"10px 12px",fontSize:13,lineHeight:1.65,color:T.navy,borderRadius:"0 6px 6px 0"}}>{expl.summary}</div>}
      {fr?.risk_before_cfDNA&&(
        <div style={{background:"#F8FEFF",border:`0.5px solid ${T.lightAqua}`,borderRadius:8,padding:"10px 12px"}}>
          <p style={{fontSize:11,fontWeight:600,color:T.dark,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.4px"}}>cfDNA Fetal Risk</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"white",borderRadius:6,padding:"8px 10px"}}>
              <p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>Before cfDNA</p>
              <p style={{fontSize:14,fontWeight:600,color:T.softBlack,margin:0}}>{fr.risk_before_cfDNA}</p>
            </div>
            <div style={{background:"white",borderRadius:6,padding:"8px 10px",border:`1px solid ${fr.fetal_risk_status==="high_risk"?T.orange:"#A8E6C0"}`}}>
              <p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>After cfDNA</p>
              <p style={{fontSize:14,fontWeight:600,color:fr.fetal_risk_status==="high_risk"?T.orange:"#1E7A38",margin:0}}>{fr.risk_after_cfDNA}</p>
            </div>
          </div>
        </div>
      )}
      {expl.stats?.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
          {expl.stats.map((s,j)=>(
            <div key={j} style={{background:T.beige,borderRadius:8,padding:"10px 12px"}}>
              <p style={{fontSize:22,fontWeight:600,color:T.dark,margin:0}}>{s.val}</p>
              <p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0",lineHeight:1.4}}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {expl.sections?.map((sec,i)=>(
        <div key={i}>
          <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 5px"}}>{sec.label}</p>
          <p style={{fontSize:13,lineHeight:1.65,color:T.softBlack,margin:0}}>{sec.body}</p>
          {/* Video appears after the section whose number matches its position in the static content */}
          {videoEntry && videoEntry.section === (i + 1) && (
            <div style={{marginTop:10}}>
              <VideoCard videoId={videoEntry.videoId} title={videoEntry.title}/>
            </div>
          )}
        </div>
      ))}
      {/* Fallback: video is section 1 but AI didn't generate named sections */}
      {videoEntry && videoEntry.section === 1 && (!expl.sections || expl.sections.length === 0) && (
        <VideoCard videoId={videoEntry.videoId} title={videoEntry.title}/>
      )}
      {expl.ethnicity_table&&<EthnicityTable rows={expl.ethnicity_table}/>}
      {showCord&&<CordBloodCard/>}
      {expl.action?.type&&(
        <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px 16px",background:T.dark,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>
          {expl.action.type==="cardiology_eval"?"❤️":expl.action.type==="genetic_counseling"?<BubbleIcon size={18}/>:<PNDIcon size={18}/>} {expl.action.label}
        </button>
      )}
    </div>
  );
}

// ─── ANP content components ───────────────────────────────────────────────────
function UnityConfirmBanner({deadline}) {
  return (
    <div style={{background:"linear-gradient(135deg,#084153,#0A5A74)",borderRadius:10,padding:"14px 16px",border:"0.5px solid rgba(82,194,207,0.3)",marginTop:12}}>
      <div style={{display:"flex",gap:10}}>
        <UnityConfirmIcon size={28}/>
        <div>
          <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 3px"}}>Unity Confirm Available</p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.55}}>
            A follow-up cfDNA test can be considered before pursuing invasive testing. New blood draw by <strong style={{color:T.aqua}}>{deadline}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
function ANPExplContent({expl}) {
  if(!expl) return <Dots/>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {expl.summary&&<div style={{background:T.sky,borderLeft:`3px solid ${T.aqua}`,padding:"10px 12px",fontSize:13,lineHeight:1.65,color:T.navy,borderRadius:"0 6px 6px 0"}}>{expl.summary}</div>}
      {expl.stats?.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
          {expl.stats.map((s,j)=>(
            <div key={j} style={{background:T.beige,borderRadius:8,padding:"10px 12px"}}>
              <p style={{fontSize:22,fontWeight:600,color:T.dark,margin:0}}>{s.val}</p>
              <p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0",lineHeight:1.4}}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {expl.sections?.map((sec,i)=>(
        <div key={i}>
          <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 5px"}}>{sec.label}</p>
          {/* Render newlines in section body */}
          {sec.body.split("\n\n").map((para,pi)=>(
            <p key={pi} style={{fontSize:13,lineHeight:1.65,color:T.softBlack,margin:pi>0?"8px 0 0":0}}>{para}</p>
          ))}
          {/* Video appears after its section's text, sourced directly from the section data */}
          {sec.video_id&&(
            <div style={{marginTop:10}}>
              <VideoCard videoId={sec.video_id} title={sec.video_title||"Learn More"}/>
            </div>
          )}
        </div>
      ))}
      {expl.action?.type&&(
        <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px 16px",background:T.dark,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>
          {expl.action.type==="genetic_counseling"?<BubbleIcon size={18}/>:<PNDIcon size={18}/>} {expl.action.label}
        </button>
      )}
    </div>
  );
}

// ─── QC Fail bypass screen ────────────────────────────────────────────────────
const ALERT = {
  standard:null,
  high_risk:{ bg:"#FFF0ED",border:"#FBBDAD",icon:"🔴",text:"Your report contains a high-risk fetal result. We strongly recommend reviewing the guide and speaking with a healthcare provider or genetic counselor as soon as possible." },
  no_call:  { bg:"#FFFBEB",border:"#FDDCB5",icon:"⚠️",text:"Your sample returned a No Call result — a new blood draw may be needed. Review the guide to understand what this means and what happens next." },
  qc_fail:  { bg:"#FFFBEB",border:"#FDDCB5",icon:"⚠️",text:"Your sample did not pass quality control. This is a technical issue with the sample, not a result about your genetic status." },
};

// ─── Shared nav bar ───────────────────────────────────────────────────────────
function NavBar({title, onHome, rightSlot=null, mobile=false}) {
  return (
    <div style={{background:T.navy, padding:mobile?"10px 16px 10px":"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:mobile?undefined:56, flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:mobile?8:18}}>
        <UnityLogo height={mobile?22:28}/>
        {!mobile&&<div style={{height:18,width:1,background:"rgba(255,255,255,0.15)"}}/>}
        {!mobile&&<span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{title}</span>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {rightSlot}
        <button onClick={onHome} style={{background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.8)",padding:mobile?"5px 12px":"6px 14px",borderRadius:20,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          ⌂ Home
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ─── SHARED HOME SCREEN ───────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
function SharedHomeScreen({onSelectBranch, mobile=false}) {
  const pad = mobile ? "20px 20px 40px" : "52px 60px";
  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100%",background:mobile?T.dark:T.beige}}>
      {/* Header */}
      <div style={{background:T.navy,padding:mobile?"12px 20px":"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between",height:mobile?undefined:60,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <UnityLogo height={mobile?22:28}/>
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:"0.5px",textTransform:"uppercase"}}>Patient Portal</span>
      </div>

      {/* Hero panel (desktop only) */}
      {!mobile&&(
        <div style={{background:T.dark,padding:"40px 48px 36px",flexShrink:0}}>
          <p style={{fontSize:11,color:T.aqua,margin:"0 0 10px",letterSpacing:"2px",textTransform:"uppercase",fontWeight:600}}>Your results are ready</p>
          <h1 style={{fontSize:36,fontWeight:700,color:"white",margin:"0 0 4px",lineHeight:1.08,letterSpacing:"-0.7px"}}>Explore your test results</h1>
          <h1 style={{fontSize:36,fontWeight:700,color:T.aqua,margin:"0 0 16px",lineHeight:1.08,letterSpacing:"-0.7px"}}>in plain language.</h1>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.7,maxWidth:480}}>
            Tap a result below to explore it in plain language. You can switch between results at any time.
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{flex:1,background:mobile?undefined:T.beige,borderRadius:mobile?"20px 20px 0 0":0,padding:mobile?"20px 20px 40px":pad,display:"flex",flexDirection:"column",gap:mobile?12:16,marginTop:mobile?0:0}}>

        {mobile&&(
          <div style={{padding:"18px 0 6px"}}>
            <p style={{fontSize:11,color:T.aqua,margin:"0 0 6px",letterSpacing:"2px",textTransform:"uppercase",fontWeight:600}}>Your results are ready</p>
            <h2 style={{fontSize:24,fontWeight:700,color:"white",margin:"0 0 8px",lineHeight:1.1}}>Which results would<br/>you like to explore?</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.6}}>Tap a result to explore it in plain language. Switch between results at any time.</p>
          </div>
        )}

        {/* ANP Card */}
        <button onClick={()=>onSelectBranch("anp")}
          style={{width:"100%",background:"white",border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 22px",cursor:"pointer",textAlign:"left",
            boxShadow:"0 2px 8px rgba(2,38,51,0.06)",transition:"box-shadow 0.15s,transform 0.1s"}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 28px rgba(2,38,51,0.13)";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(2,38,51,0.06)";e.currentTarget.style.transform="none";}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{flexShrink:0}}><ANPIcon size={36}/></div>
                <div>
                  <p style={{fontSize:15,fontWeight:700,color:T.dark,margin:0}}>Aneuploidy Results</p>
                  <p style={{fontSize:12,color:T.textMuted,margin:0}}>Unity Aneuploidy™ NIPT</p>
                </div>
              </div>
              <p style={{fontSize:13,color:T.softBlack,margin:"0 0 12px",lineHeight:1.6}}>
                Explore your chromosomal screening results — including Trisomy 21, 18, 13, sex chromosomes, 22q microdeletion, fetal RhD, and fetal antigen panels.
              </p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["Trisomy 21/18/13","22q Microdeletion","Fetal RhD","Fetal Antigen"].map(t=>(
                  <span key={t} style={{fontSize:10,background:T.sky,color:T.dark,padding:"3px 9px",borderRadius:20,fontWeight:500}}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{width:36,height:36,borderRadius:"50%",background:T.dark,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
              <span style={{color:T.aqua,fontSize:16,fontWeight:700}}>→</span>
            </div>
          </div>
        </button>

        {/* Carrier Card */}
        <button onClick={()=>onSelectBranch("carrier")}
          style={{width:"100%",background:"white",border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 22px",cursor:"pointer",textAlign:"left",
            boxShadow:"0 2px 8px rgba(2,38,51,0.06)",transition:"box-shadow 0.15s,transform 0.1s"}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 28px rgba(2,38,51,0.13)";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(2,38,51,0.06)";e.currentTarget.style.transform="none";}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{flexShrink:0}}><CarrierIcon size={36}/></div>
                <div>
                  <p style={{fontSize:15,fontWeight:700,color:T.dark,margin:0}}>Carrier Screen Results</p>
                  <p style={{fontSize:12,color:T.textMuted,margin:0}}>Unity Carrier Screen™</p>
                </div>
              </div>
              <p style={{fontSize:13,color:T.softBlack,margin:"0 0 12px",lineHeight:1.6}}>
                Explore your carrier screening results for conditions like sickle cell disease, cystic fibrosis, spinal muscular atrophy, and more — including any fetal cfDNA risk.
              </p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["Sickle Cell","Cystic Fibrosis","SMA","Alpha-Thal","cfDNA Fetal Risk"].map(t=>(
                  <span key={t} style={{fontSize:10,background:T.sky,color:T.dark,padding:"3px 9px",borderRadius:20,fontWeight:500}}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{width:36,height:36,borderRadius:"50%",background:T.dark,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
              <span style={{color:T.aqua,fontSize:16,fontWeight:700}}>→</span>
            </div>
          </div>
        </button>

        <LegalFooter style={{marginTop:mobile?8:12}}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ─── CARRIER BRANCH ───────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
function CarrierDesktopExplorer({report, onHome}) {
  const [sel,setSel]=useState(null);
  const [showFF,setShowFF]=useState(false);
  const [expls,setExpls]=useState({});
  const [ffExpl,setFfExpl]=useState(null);
  const [loading,setLoading]=useState(null);
  const [filter,setFilter]=useState("all");
  const [detailTab,setDetailTab]=useState("overview"); // "overview" | "infosheet"
  const {patient,summary,carrier_screen,report_meta,provider}=report;
  const notable=carrier_screen.conditions.filter(c=>["positive","snp_present","no_call","qc_fail"].includes(c.carrier_status));
  const displayed=filter==="positive"?notable:carrier_screen.conditions;
  let lastPanel=null;
  async function pick(condition) {
    if(showFF)setShowFF(false);
    if(sel?.condition_id===condition.condition_id){setSel(null);return;}
    setDetailTab("overview");
    setSel(condition);
    const key=condition.condition_id;
    if(!expls[key]){
      const sk=getStaticKey(report,condition);
      if(sk){const id=(report.static_explanation_map||{})[key]||sk;setExpls(p=>({...p,[key]:STATIC_EXPLANATIONS[id]||STATIC_EXPLANATIONS[sk]}));}
      else{setLoading(key);try{const e=await fetchExplanation(condition,report);setExpls(p=>({...p,[key]:e}));}catch{}setLoading(null);}
    }
  }
  async function openFF(){setSel(null);setShowFF(v=>!v);if(!ffExpl){setFfExpl(STATIC_EXPLANATIONS["FETAL_FRACTION_EXPLANATION"]);}}
  const showPanel=!!sel||showFF;
  return (
    <div style={{background:"#F0F4F6",minHeight:"100%",display:"flex",flexDirection:"column"}}>
      <NavBar title="Carrier Screen Explorer" onHome={onHome}
        rightSlot={<span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{patient.name}</span>}/>
      <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 56px - 42px)"}}>
        {/* Sidebar */}
        <div style={{width:254,background:"white",borderRight:`0.5px solid ${T.border}`,overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"16px 18px 12px",borderBottom:`0.5px solid ${T.border}`}}>
            <p style={{fontSize:14,fontWeight:600,color:T.dark,margin:"0 0 2px"}}>{patient.name}</p>
            <p style={{fontSize:11,color:T.textMuted,margin:"0 0 8px"}}>{gaStr(patient.gestational_age_at_draw)} · {fmtDate(report_meta.date_reported)}</p>
            {[["Provider",provider.name],["Report ID",report_meta.report_id]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                <span style={{color:T.textMuted}}>{l}</span>
                <span style={{color:T.softBlack,fontWeight:500,textAlign:"right",maxWidth:140}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 18px",borderBottom:`0.5px solid ${T.border}`}}>
            <p style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 8px"}}>Overall Status</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:T.textMuted,flex:1}}>Carrier screen</span>
                <CarrierStatusBadge status={summary.overall_carrier_status} small/>
              </div>
              {summary.overall_fetal_risk_status!=="not_applicable"&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:T.textMuted,flex:1}}>Fetal risk</span>
                  <CarrierStatusBadge status={summary.overall_fetal_risk_status} small/>
                </div>
              )}
              {summary.fetal_fraction_percent&&(
                <button onClick={openFF} style={{display:"flex",alignItems:"center",gap:6,background:showFF?T.sky:"transparent",border:`0.5px solid ${showFF?T.aqua:T.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",textAlign:"left",marginTop:2}}>
                  <div><p style={{fontSize:11,fontWeight:600,color:T.dark,margin:0}}>{summary.fetal_fraction_percent}%</p><p style={{fontSize:10,color:T.textMuted,margin:0}}>Fetal fraction</p></div>
                  <span style={{marginLeft:"auto",fontSize:11,color:T.aqua}}>ⓘ</span>
                </button>
              )}
            </div>
          </div>
          {summary.follow_up_recommendations.length>0&&(
            <div style={{padding:"12px 18px",borderBottom:`0.5px solid ${T.border}`}}>
              <p style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 7px"}}>Follow-up</p>
              {summary.follow_up_recommendations.map(r=>(
                <div key={r.priority} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:7}}>
                  <span style={{flexShrink:0,marginTop:1}}>{r.type==="genetic_counseling"?<BubbleIcon size={16}/>:r.type==="prenatal_diagnosis"?<PNDIcon size={16}/>:recIcon[r.type]||"ℹ️"}</span>
                  <p style={{fontSize:11,color:T.navy,margin:0,lineHeight:1.5}}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{padding:"12px 18px",marginTop:"auto"}}>
            <a href="tel:+18334081488" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:T.sky,borderRadius:8,border:`0.5px solid ${T.lightAqua}`,textDecoration:"none"}}>
              <CustomerServiceIcon size={28}/>
              <div><p style={{fontSize:12,fontWeight:600,color:T.dark,margin:0}}>+1 (833) 408-1488</p><p style={{fontSize:10,color:T.textMuted,margin:0}}>Unity support</p></div>
            </a>
          </div>
        </div>
        {/* Center */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <h2 style={{fontSize:16,fontWeight:600,color:T.dark,margin:0}}>Carrier Screen Results</h2>
              <p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>{carrier_screen.conditions.length} conditions tested</p>
            </div>
            <div style={{display:"flex",gap:6}}>
              {["all","positive"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:`0.5px solid ${filter===f?T.aqua:T.border}`,background:filter===f?T.sky:"white",color:filter===f?T.dark:T.textMuted}}>
                  {f==="all"?`All (${carrier_screen.conditions.length})`:`Notable (${notable.length})`}
                </button>
              ))}
            </div>
          </div>
          <div style={{background:T.sky,border:`0.5px solid ${T.lightAqua}`,borderRadius:8,padding:"7px 14px",marginBottom:12,display:"flex",gap:8}}>
            <span style={{fontSize:13,color:T.aqua}}>ⓘ</span>
            <p style={{fontSize:12,color:T.dark,margin:0}}>Click any row to open a plain-language explanation.</p>
          </div>
          <div style={{background:"white",borderRadius:10,border:`0.5px solid ${T.border}`,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 88px 100px 110px",padding:"8px 16px",background:T.gray,borderBottom:`0.5px solid ${T.border}`}}>
              {["Condition","Gene(s)","Carrier","Fetal Risk"].map(h=>(
                <span key={h} style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</span>
              ))}
            </div>
            {displayed.map(c=>{
              const fr=getFetalRisk(report,c.condition_id);
              const showH=filter==="all"&&c.panel!==lastPanel;
              if(showH)lastPanel=c.panel;
              const notab=["positive","snp_present","no_call","qc_fail"].includes(c.carrier_status);
              const isSel=sel?.condition_id===c.condition_id;
              return (
                <div key={c.condition_id}>
                  {showH&&<div style={{padding:"5px 16px",background:"#FAFAFA",borderBottom:`0.5px solid ${T.border}`,borderTop:`0.5px solid ${T.border}`}}><span style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.6px"}}>{panelLabel[c.panel]}</span></div>}
                  <button onClick={()=>pick(c)} style={{display:"grid",gridTemplateColumns:"1fr 88px 100px 110px",width:"100%",padding:"11px 16px",background:isSel?T.sky:notab?"#FFFAF7":"white",border:"none",borderBottom:`0.5px solid ${T.border}`,cursor:"pointer",textAlign:"left",outline:isSel?`1.5px solid ${T.aqua}`:"none",outlineOffset:-1}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:notab?600:400,color:notab?T.dark:T.softBlack,margin:0}}>{c.condition_name}</p>
                      {c.additional_detail&&<p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0"}}>{c.additional_detail}</p>}
                      {c.variant_detail&&<p style={{fontSize:10,color:T.textMuted,margin:"2px 0 0",fontFamily:"monospace"}}>{c.variant_detail.variant_name}</p>}
                    </div>
                    <span style={{fontSize:12,color:T.textMuted,alignSelf:"center"}}>{c.gene_symbols.join(", ")}</span>
                    <div style={{alignSelf:"center"}}><CarrierStatusBadge status={c.carrier_status} small/></div>
                    <div style={{alignSelf:"center"}}>{fr?<CarrierStatusBadge status={fr.fetal_risk_status} small/>:<span style={{fontSize:11,color:T.border}}>—</span>}</div>
                  </button>
                </div>
              );
            })}
          </div>
          {report.interpretation.carrier_screen_positive.length>0&&(
            <div style={{marginTop:16,background:"white",borderRadius:10,border:`0.5px solid ${T.border}`,padding:"14px 18px"}}>
              <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 7px"}}>Clinical Interpretation</p>
              {report.interpretation.carrier_screen_positive.map(i=>(
                <p key={i.condition_id} style={{fontSize:13,lineHeight:1.7,color:T.softBlack,margin:0}}>{i.clinical_text}</p>
              ))}
            </div>
          )}
          <LegalFooter style={{marginTop:18,marginBottom:8}}/>
        </div>
        {/* Right panel */}
        <div style={{width:showPanel?334:0,transition:"width 0.25s ease",overflow:"hidden",borderLeft:`0.5px solid ${T.border}`,background:"white",display:"flex",flexDirection:"column",flexShrink:0}}>
          {showPanel&&(
            <div style={{width:334,display:"flex",flexDirection:"column",height:"100%"}}>
              {/* Panel header */}
              <div style={{padding:"14px 18px 0",borderBottom:`0.5px solid ${T.border}`,flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontSize:10,background:T.sky,color:T.dark,padding:"2px 8px",borderRadius:10,fontWeight:600,display:"inline-block",marginBottom:5}}>
                      {showFF?"Test quality":sel?.carrier_status==="snp_present"?"Possible silent carrier":sel?.carrier_status==="positive"?"Your result":"Screened condition"}
                    </span>
                    <p style={{fontSize:14,fontWeight:600,color:T.dark,margin:0,lineHeight:1.3}}>{showFF?"Fetal fraction":sel?.condition_name}</p>
                    {sel?.variant_detail&&<p style={{fontSize:10,color:T.textMuted,margin:"2px 0 0",fontFamily:"monospace"}}>{sel.variant_detail.variant_name}</p>}
                  </div>
                  <button onClick={()=>{setSel(null);setShowFF(false);}} style={{width:26,height:26,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:15,color:T.textMuted,flexShrink:0,marginLeft:8}}>×</button>
                </div>
                {/* Tab bar — only show when a condition is selected and has an info sheet */}
                {sel&&getInfoSheet(sel,report)&&(
                  <div style={{display:"flex",gap:2,background:T.gray,borderRadius:8,padding:3,marginBottom:0}}>
                    {[["overview","Overview"],["infosheet","📋 Info Sheet"]].map(([key,label])=>(
                      <button key={key} onClick={()=>setDetailTab(key)}
                        style={{flex:1,padding:"5px 8px",borderRadius:6,fontSize:12,fontWeight:detailTab===key?600:400,border:`0.5px solid ${detailTab===key?T.lightAqua:"transparent"}`,background:detailTab===key?"white":"transparent",color:detailTab===key?T.dark:T.textMuted,cursor:"pointer",whiteSpace:"nowrap"}}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Panel body */}
              <div style={{padding:"14px 18px",flex:1,overflowY:"auto"}}>
                {showFF&&(!ffExpl?<Dots/>:<CarrierExplContent expl={ffExpl} condition={null} report={report}/>)}
                {sel&&detailTab==="overview"&&(loading===sel.condition_id?<Dots/>:<CarrierExplContent expl={expls[sel.condition_id]} condition={sel} report={report}/>)}
                {sel&&detailTab==="infosheet"&&<InfoSheetPanel sheet={getInfoSheet(sel,report)}/>}
              </div>
              <div style={{padding:"10px 18px 14px",borderTop:`0.5px solid ${T.border}`,flexShrink:0}}>
                {sel&&detailTab==="overview"&&!getStaticKey(report,sel)&&<AINote/>}
                {sel&&detailTab==="infosheet"&&(
                  <p style={{fontSize:10,color:T.textMuted,margin:0,lineHeight:1.5}}>Content mirrors your printed info sheet. Always discuss results with your provider.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile condition sheet with tabs ─────────────────────────────────────────
function MobileConditionSheet({active, showFF, loading, expls, ffExpl, report, onClose}) {
  const [tab, setTab] = useState("overview");
  const hasSheet = active && getInfoSheet(active, report);
  return (
    <>
      <div style={{padding:"8px 18px 0",borderBottom:`0.5px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{flex:1}}>
            <span style={{fontSize:10,background:T.sky,color:T.dark,padding:"2px 8px",borderRadius:10,fontWeight:600,display:"inline-block",marginBottom:5}}>
              {showFF?"Test quality":active?.carrier_status==="snp_present"?"Possible silent carrier":active?.carrier_status==="positive"?"Your result":"Screened condition"}
            </span>
            <p style={{fontSize:15,fontWeight:600,color:T.dark,margin:0,lineHeight:1.25}}>{showFF?"Fetal fraction":active?.condition_name}</p>
            {active?.variant_detail&&<p style={{fontSize:10,color:T.textMuted,margin:"3px 0 0",fontFamily:"monospace"}}>{active.variant_detail.variant_name}</p>}
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:15,color:T.textMuted,flexShrink:0}}>×</button>
        </div>
        {hasSheet&&(
          <div style={{display:"flex",gap:2,background:T.gray,borderRadius:8,padding:3,marginBottom:0}}>
            {[["overview","Overview"],["infosheet","📋 Info Sheet"]].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)}
                style={{flex:1,padding:"5px 8px",borderRadius:6,fontSize:12,fontWeight:tab===key?600:400,border:`0.5px solid ${tab===key?T.lightAqua:"transparent"}`,background:tab===key?"white":"transparent",color:tab===key?T.dark:T.textMuted,cursor:"pointer"}}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:"14px 18px 32px"}}>
        {showFF&&(!ffExpl?<Dots/>:<CarrierExplContent expl={ffExpl} condition={null} report={report}/>)}
        {active&&tab==="overview"&&(loading===active.condition_id?<Dots/>:<CarrierExplContent expl={expls[active.condition_id]} condition={active} report={report}/>)}
        {active&&tab==="infosheet"&&<InfoSheetPanel sheet={getInfoSheet(active,report)} mobile/>}
        {active&&tab==="overview"&&!getStaticKey(report,active)&&<AINote/>}
        {active&&tab==="infosheet"&&(
          <p style={{fontSize:10,color:T.textMuted,margin:"12px 0 0",lineHeight:1.5}}>Content mirrors your printed info sheet. Always discuss results with your provider.</p>
        )}
        
      </div>
    </>
  );
}

function CarrierMobileExplorer({report, onHome}) {
  const [active,setActive]=useState(null);
  const [showFF,setShowFF]=useState(false);
  const [showCtx,setShowCtx]=useState(false);
  const [filter,setFilter]=useState("all");
  const [expls,setExpls]=useState({});
  const [ffExpl,setFfExpl]=useState(null);
  const [loading,setLoading]=useState(null);
  const startY=useRef(null);
  const {patient,summary,carrier_screen,report_meta}=report;
  const notable=carrier_screen.conditions.filter(c=>["positive","snp_present","no_call","qc_fail"].includes(c.carrier_status));
  const displayed=filter==="positive"?notable:carrier_screen.conditions;
  let lastPanel=null;
  async function tap(condition){
    setShowFF(false);setShowCtx(false);
    if(active?.condition_id===condition.condition_id){setActive(null);return;}
    setActive(condition);
    const key=condition.condition_id;
    if(!expls[key]){
      const sk=getStaticKey(report,condition);
      if(sk){const id=(report.static_explanation_map||{})[key]||sk;setExpls(p=>({...p,[key]:STATIC_EXPLANATIONS[id]||STATIC_EXPLANATIONS[sk]}));}
      else{setLoading(key);try{const e=await fetchExplanation(condition,report);setExpls(p=>({...p,[key]:e}));}catch{}setLoading(null);}
    }
  }
  async function openFF(){setActive(null);setShowCtx(false);setShowFF(true);if(!ffExpl){setFfExpl(STATIC_EXPLANATIONS["FETAL_FRACTION_EXPLANATION"]);}}
  const sw=(setter)=>({onTouchStart:(e)=>{startY.current=e.touches[0].clientY;},onTouchEnd:(e)=>{if(startY.current&&e.changedTouches[0].clientY-startY.current>60)setter(false);startY.current=null;}});
  const sheet=(onClose,children,maxH="80%")=>(
    <div style={{position:"absolute",inset:0,zIndex:20}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(2,38,51,0.4)"}}/>
      <div {...sw(onClose)} style={{position:"absolute",bottom:0,left:0,right:0,background:"white",borderRadius:"16px 16px 0 0",zIndex:21,maxHeight:maxH,overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:T.border}}/></div>
        {children}
      </div>
    </div>
  );
  return (
    <div style={{background:"#F4F7F8",minHeight:"100%",position:"relative"}}>
      <div style={{background:T.dark,padding:"14px 16px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:5}}>
        <div>
          <UnityLogo height={24}/>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>Carrier Screen</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setShowCtx(true);setActive(null);setShowFF(false);}} style={{background:T.aqua,border:"none",color:T.dark,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Contact</button>
          <button onClick={onHome} style={{background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.8)",padding:"6px 10px",borderRadius:8,fontSize:12,cursor:"pointer"}}>⌂</button>
        </div>
      </div>
      <div style={{background:"white",padding:"9px 16px",borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><p style={{fontSize:13,fontWeight:600,color:T.softBlack,margin:0}}>{patient.name}</p><p style={{fontSize:11,color:T.textMuted,margin:0}}>{gaStr(patient.gestational_age_at_draw)} · {fmtDate(report_meta.date_reported)}</p></div>
        <CarrierStatusBadge status={summary.overall_carrier_status} small/>
      </div>
      <div style={{background:T.sky,padding:"7px 16px",borderBottom:`0.5px solid ${T.lightAqua}`,display:"flex",gap:6}}>
        <span style={{fontSize:13,color:T.aqua}}>ℹ</span>
        <p style={{fontSize:12,color:T.dark,margin:0}}>Tap any condition for a plain-language explanation</p>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{borderRadius:12,overflow:"hidden",marginBottom:12,border:`0.5px solid ${T.lightAqua}`}}>
          <div style={{background:T.dark,padding:"8px 16px"}}><p style={{fontSize:10,color:"rgba(255,255,255,0.55)",margin:0,textTransform:"uppercase",letterSpacing:"0.6px"}}>Summary of results</p></div>
          <div style={{background:T.aqua,padding:"9px 16px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:STATUS_CFG[summary.overall_carrier_status]?.color||T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>+</div>
              <div><p style={{fontSize:11,fontWeight:700,color:T.navy,margin:0}}>{(STATUS_CFG[summary.overall_carrier_status]?.label||"").toUpperCase()}</p><p style={{fontSize:10,color:T.dark,margin:0}}>Carrier</p></div>
            </div>
            {!["not_applicable","not_performed"].includes(summary.overall_fetal_risk_status)&&(
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:STATUS_CFG[summary.overall_fetal_risk_status]?.color||T.mango,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>!</div>
                <div><p style={{fontSize:11,fontWeight:700,color:T.navy,margin:0}}>{(STATUS_CFG[summary.overall_fetal_risk_status]?.label||"").toUpperCase()}</p><p style={{fontSize:10,color:T.dark,margin:0}}>Fetus</p></div>
              </div>
            )}
            {summary.fetal_fraction_percent&&(
              <button onClick={openFF} style={{marginLeft:"auto",background:"rgba(2,38,51,0.12)",border:"0.5px solid rgba(2,38,51,0.2)",borderRadius:12,padding:"3px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                <p style={{fontSize:11,color:T.navy,margin:0,fontWeight:600}}>{summary.fetal_fraction_percent}% FF</p>
                <span style={{fontSize:11,color:T.navy}}>ⓘ</span>
              </button>
            )}
          </div>
          <div style={{background:T.sky,padding:"4px 16px 10px"}}>
            <p style={{fontSize:10,color:T.dark,margin:"7px 0 4px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,opacity:0.7}}>Recommended follow-up</p>
            {summary.follow_up_recommendations.map(r=>(
              <div key={r.priority} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                <span style={{flexShrink:0,marginTop:1}}>{r.type==="genetic_counseling"?<BubbleIcon size={15}/>:r.type==="prenatal_diagnosis"?<PNDIcon size={15}/>:recIcon[r.type]||"ℹ️"}</span>
                <p style={{fontSize:11,color:T.navy,margin:0,lineHeight:1.5}}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {["all","positive"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:`0.5px solid ${filter===f?T.aqua:T.border}`,background:filter===f?T.sky:"white",color:filter===f?T.dark:T.textMuted}}>
              {f==="all"?`All (${carrier_screen.conditions.length})`:`Notable (${notable.length})`}
            </button>
          ))}
        </div>
        <div style={{borderRadius:12,overflow:"hidden",border:`0.5px solid ${T.border}`,marginBottom:80}}>
          {displayed.map((c,i)=>{
            const fr=getFetalRisk(report,c.condition_id);
            const showH=filter==="all"&&c.panel!==lastPanel;
            if(showH)lastPanel=c.panel;
            const notab=["positive","snp_present","no_call","qc_fail"].includes(c.carrier_status);
            const isAct=active?.condition_id===c.condition_id;
            return (
              <div key={c.condition_id}>
                {showH&&<div style={{padding:"6px 14px",background:T.dark}}><span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.6px"}}>{panelLabel[c.panel]}</span></div>}
                <button onClick={()=>tap(c)} style={{display:"flex",alignItems:"center",width:"100%",padding:"12px 14px",background:isAct?T.sky:notab?"#FFFAF7":"white",border:"none",borderBottom:i<displayed.length-1?`0.5px solid ${T.border}`:"none",borderLeft:`3px solid ${notab?STATUS_CFG[c.carrier_status]?.color||T.orange:"transparent"}`,cursor:"pointer",textAlign:"left",gap:10}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:notab?600:400,color:notab?T.dark:T.softBlack,margin:0}}>{c.condition_name}</p>
                    {c.additional_detail&&<p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0"}}>{c.additional_detail}</p>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                    <CarrierStatusBadge status={c.carrier_status} small/>
                    {fr&&<CarrierStatusBadge status={fr.fetal_risk_status} small/>}
                  </div>
                  <span style={{fontSize:16,color:T.textMuted,flexShrink:0}}>›</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Sheets */}
      {(active||showFF)&&sheet(()=>{setActive(null);setShowFF(false);},(
        <MobileConditionSheet
          active={active} showFF={showFF} loading={loading}
          expls={expls} ffExpl={ffExpl} report={report}
          onClose={()=>{setActive(null);setShowFF(false);}}
        />
      ))}
      {showCtx&&sheet(()=>setShowCtx(false),(
        <>
          <div style={{padding:"8px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${T.border}`}}>
            <div><p style={{fontSize:15,fontWeight:600,color:T.dark,margin:0}}>Contact Unity</p><p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>Mon–Fri, 8am–5pm PT</p></div>
            <button onClick={()=>setShowCtx(false)} style={{width:28,height:28,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:16,color:T.textMuted}}>×</button>
          </div>
          <div style={{padding:"12px 16px 32px",display:"flex",flexDirection:"column",gap:10}}>
            <a href="tel:+18334081488" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:T.sky,borderRadius:12,border:`0.5px solid ${T.lightAqua}`,textDecoration:"none"}}>
              <CustomerServiceIcon size={40}/>
              <div><p style={{fontSize:13,fontWeight:600,color:T.dark,margin:0}}>+1 (833) 408-1488</p><p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0"}}>Call or text our support team</p></div>
              <span style={{marginLeft:"auto",color:T.aqua}}>›</span>
            </a>
            <a href="mailto:support@unityscreen.com" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:T.sky,borderRadius:12,border:`0.5px solid ${T.lightAqua}`,textDecoration:"none"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:T.dark,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✉️</div>
              <div><p style={{fontSize:13,fontWeight:600,color:T.dark,margin:0}}>support@unityscreen.com</p><p style={{fontSize:11,color:T.textMuted,margin:"2px 0 0"}}>Email our support team</p></div>
              <span style={{marginLeft:"auto",color:T.aqua}}>›</span>
            </a>
          </div>
        </>
      ),"60%")}
      <div style={{position:"sticky",bottom:0,background:"white",borderTop:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:4}}>
        {[{icon:"📋",label:"Results",a:true},{icon:"📅",label:"Schedule",a:false},{icon:"👤",label:"Profile",a:false}].map(i=>(
          <button key={i.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:i.a?T.dark:T.textMuted}}>
            <span style={{fontSize:18}}>{i.icon}</span>
            <span style={{fontSize:10,fontWeight:i.a?600:400}}>{i.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ─── ANP BRANCH ───────────────────────────────────════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════
function ANPDesktopExplorer({report, onHome}) {
  const [sel,setSel]=useState(null);
  const [showFF,setShowFF]=useState(false);
  const [expls,setExpls]=useState({});
  const [ffExpl,setFfExpl]=useState(null);
  const [loading,setLoading]=useState(null);
  const {patient,summary,panels,interpretation,report_meta,provider}=report;
  const isHighRisk=summary.overall_status==="high_risk";
  function pickCondition(condition,panel){
    setShowFF(false);
    const key=`${panel.id}__${condition.id}`;
    if(sel?.key===key){setSel(null);return;}
    setSel({key,condition,panel});
    if(!expls[key]){
      const panelHasHighRisk=panel.conditions.some(c=>c.id!==condition.id&&c.status==="high_risk");
      const staticKey=getANPStaticKey(panel.id,condition.id,condition.status,summary.gestation,panelHasHighRisk);
      const staticContent=staticKey?ANP_STATIC_CONTENT[staticKey]:null;
      if(staticContent){setExpls(p=>({...p,[key]:staticContent}));}
      // If no static key is mapped (e.g. custom/edge-case profiles), show nothing rather than AI
    }
  }
  async function openFF(){setSel(null);setShowFF(v=>!v);if(!ffExpl&&summary.fetal_fraction_percent){setFfExpl(STATIC_EXPLANATIONS["FETAL_FRACTION_EXPLANATION"]);}}
  const showPanel=!!sel||showFF;
  return (
    <div style={{background:"#F0F4F6",minHeight:"100%",display:"flex",flexDirection:"column"}}>
      <NavBar title="Aneuploidy Report Explorer" onHome={onHome}
        rightSlot={<span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{patient.name}</span>}/>
      <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 56px - 42px)"}}>
        {/* Sidebar */}
        <div style={{width:264,background:"white",borderRight:`0.5px solid ${T.border}`,overflowY:"auto",flexShrink:0}}>
          <div style={{padding:"16px 18px 12px",borderBottom:`0.5px solid ${T.border}`,background:T.sky}}>
            <p style={{fontSize:14,fontWeight:600,color:T.dark,margin:"0 0 2px"}}>{patient.name}</p>
            <p style={{fontSize:11,color:T.textMuted,margin:"0 0 8px"}}>{gaStr(patient.gestational_age)} · {fmtDate(report_meta.date_reported)}</p>
            {provider&&<p style={{fontSize:11,color:T.textMuted,margin:"0 0 2px"}}>{provider.name}</p>}
            <p style={{fontSize:10,color:T.textMuted,margin:0,fontFamily:"monospace"}}>{report_meta.report_id}</p>
          </div>
          <div style={{padding:"12px 18px",borderBottom:`0.5px solid ${T.border}`}}>
            <p style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",margin:"0 0 6px",fontWeight:600}}>Summary</p>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <ANPStatusBadge status={summary.overall_status==="antigen_detected"?"detected":summary.overall_status} label_override={summary.headline} size="sm"/>
            </div>
            {summary.gestation==="twin"&&summary.zygosity&&<p style={{fontSize:12,color:T.dark,margin:"4px 0 2px"}}>Dizygotic twins (fraternal)</p>}
            {summary.fetal_sex?.map((fs,i)=>(
              <p key={i} style={{fontSize:12,color:T.textMuted,margin:"2px 0"}}>{fs.label}: {fs.sex.charAt(0).toUpperCase()+fs.sex.slice(1)} fetal sex</p>
            ))}
            {summary.fetal_fraction_percent&&(
              <button onClick={openFF} style={{marginTop:6,background:showFF?T.lightAqua:"transparent",border:`0.5px solid ${T.lightAqua}`,borderRadius:20,padding:"3px 10px",fontSize:11,color:T.dark,cursor:"pointer",fontWeight:500}}>
                {summary.fetal_fraction_percent}% fetal fraction
              </button>
            )}
          </div>
          {panels.map(panel=>(
            <div key={panel.id} style={{borderBottom:`0.5px solid ${T.border}`}}>
              <div style={{padding:"10px 18px 6px",background:"#F8FAFC"}}>
                <p style={{fontSize:10,fontWeight:600,color:T.dark,margin:0,textTransform:"uppercase",letterSpacing:"0.6px"}}>{panel.title.replace("™ NIPT","").replace("™","")}</p>
                <p style={{fontSize:10,color:T.textMuted,margin:"1px 0 0"}}>{panel.subtitle}</p>
              </div>
              {panel.conditions.map(cond=>{
                const key=`${panel.id}__${cond.id}`;
                const isActive=sel?.key===key;
                const cfg=cond.status==="not_detected_sca"?{color:"#1E7A38",bg:"#F0FAF3"}:ANP_STATUS[cond.status]||{color:T.textMuted,bg:T.gray};
                return (
                  <button key={cond.id} onClick={()=>pickCondition(cond,panel)}
                    style={{width:"100%",padding:"9px 18px",background:isActive?T.sky:"white",border:"none",borderLeft:`3px solid ${isActive?T.aqua:"transparent"}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,borderBottom:`0.5px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.softBlack,lineHeight:1.35,flex:1}}>{cond.name}</span>
                    <span style={{fontSize:11,fontWeight:600,color:cfg.color,background:cfg.bg,padding:"2px 8px",borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>
                      {cond.label_override||(cond.status==="not_detected_sca"?"Not Detected":(ANP_STATUS[cond.status]?.label||cond.status))}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {summary.follow_ups?.length>0&&(
            <div style={{padding:"12px 18px 16px"}}>
              <p style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",margin:"0 0 8px",fontWeight:600}}>Follow-Up</p>
              {summary.follow_ups.map((fu,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:8}}>
                  <span style={{flexShrink:0,marginTop:1}}>{fu.type==="genetic_counseling"?<BubbleIcon size={18}/>:fu.type==="prenatal_diagnosis"?<PNDIcon size={18}/>:fu.type==="unity_confirm"?<UnityConfirmIcon size={18}/>:ANP_FU_ICONS[fu.type]||"ℹ️"}</span>
                  <p style={{fontSize:11,color:T.navy,margin:0,lineHeight:1.5}}>{fu.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Main */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          {isHighRisk&&!showPanel&&(
            <div style={{background:"#FFF0ED",border:`1px solid #FBBDAD`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10,marginBottom:20}}>
              <span style={{fontSize:16,flexShrink:0}}>🔴</span>
              <p style={{fontSize:12,color:"#7A1D08",margin:0,lineHeight:1.6}}>Your report contains a <strong>HIGH RISK result</strong>. We strongly recommend speaking with a healthcare provider or genetic counselor as soon as possible.</p>
            </div>
          )}
          {summary.unity_confirm_eligible&&!showPanel&&<UnityConfirmBanner deadline={summary.unity_confirm_deadline}/>}
          {!showPanel&&panels.map(panel=>(
            <div key={panel.id} style={{background:"white",borderRadius:12,border:`0.5px solid ${T.border}`,padding:"20px 24px",marginBottom:16,boxShadow:"0 1px 4px rgba(2,38,51,0.04)"}}>
              <div style={{marginBottom:12}}>
                <p style={{fontSize:15,fontWeight:700,color:T.dark,margin:"0 0 2px"}}>{panel.title}</p>
                <p style={{fontSize:12,color:T.textMuted,margin:0}}>{panel.subtitle}</p>
                {panel.note&&<p style={{fontSize:12,color:T.softBlack,margin:"8px 0 0",lineHeight:1.6,background:T.sky,padding:"8px 12px",borderRadius:8}}>{panel.note}</p>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {panel.conditions.map(cond=>{
                  const cfg=cond.status==="not_detected_sca"?{color:"#1E7A38",bg:"#F0FAF3",label:"Not Detected"}:ANP_STATUS[cond.status]||{color:T.textMuted,bg:T.gray,label:cond.status};
                  return (
                    <button key={cond.id} onClick={()=>pickCondition(cond,panel)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#F9FBFC",borderRadius:8,border:`0.5px solid ${T.border}`,cursor:"pointer",textAlign:"left",width:"100%",transition:"background 0.1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.sky}
                      onMouseLeave={e=>e.currentTarget.style.background="#F9FBFC"}>
                      <div>
                        <span style={{fontSize:13,fontWeight:500,color:T.softBlack}}>{cond.name}</span>
                        {cond.fetal_fraction_note&&<span style={{fontSize:11,color:T.textMuted,marginLeft:8}}>{cond.fetal_fraction_note}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:11,fontWeight:700,color:cfg.color,background:cfg.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${cfg.color}22`,letterSpacing:cond.status==="high_risk"?"0.4px":"0"}}>
                          {cond.label_override||cfg.label}
                        </span>
                        {cond.badge&&<span style={{fontSize:11,background:T.dark,color:T.aqua,fontWeight:700,padding:"3px 8px",borderRadius:20}}>{cond.badge}</span>}
                        <span style={{fontSize:13,color:T.textMuted}}>›</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {interpretation[panel.id]&&(
                <div style={{marginTop:16,padding:"14px 16px",background:"#F8FAFC",borderRadius:8,border:`0.5px solid ${T.border}`}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 6px"}}>Interpretation</p>
                  <p style={{fontSize:13,fontWeight:600,color:T.dark,margin:"0 0 6px",lineHeight:1.45}}>{interpretation[panel.id].title}</p>
                  {interpretation[panel.id].body.split("\n\n").map((para,i)=>(
                    <p key={i} style={{fontSize:12,color:T.softBlack,margin:"0 0 4px",lineHeight:1.65}}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          {showFF&&(
            <div style={{background:"white",borderRadius:12,border:`0.5px solid ${T.border}`,padding:"20px 24px",boxShadow:"0 1px 4px rgba(2,38,51,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div><p style={{fontSize:15,fontWeight:700,color:T.dark,margin:0}}>Fetal Fraction</p><p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>What does this number mean?</p></div>
                <button onClick={()=>setShowFF(false)} style={{width:28,height:28,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:15,color:T.textMuted}}>×</button>
              </div>
              {!ffExpl?<Dots/>:<ANPExplContent expl={ffExpl}/>}
              
            </div>
          )}
          {sel&&(
            <div style={{background:"white",borderRadius:12,border:`0.5px solid ${T.border}`,padding:"20px 24px",boxShadow:"0 1px 4px rgba(2,38,51,0.04)"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 4px",fontWeight:600}}>{sel.panel.title}</p>
                  <p style={{fontSize:16,fontWeight:700,color:T.dark,margin:0,lineHeight:1.3}}>{sel.condition.name}</p>
                </div>
                <button onClick={()=>setSel(null)} style={{width:28,height:28,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:15,color:T.textMuted,flexShrink:0}}>×</button>
              </div>
              {sel.condition.risk_before&&(
                <div style={{background:"#F8FEFF",border:`0.5px solid ${T.lightAqua}`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.dark,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Your Risk</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:"white",borderRadius:6,padding:"10px 12px"}}><p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>Before NIPT</p><p style={{fontSize:15,fontWeight:600,color:T.softBlack,margin:0}}>{sel.condition.risk_before}</p></div>
                    <div style={{background:"white",borderRadius:6,padding:"10px 12px",border:`1px solid ${sel.condition.status==="high_risk"?T.orange:"#A8E6C0"}`}}><p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>After NIPT</p><p style={{fontSize:15,fontWeight:600,color:sel.condition.status==="high_risk"?T.orange:"#1E7A38",margin:0}}>{sel.condition.risk_after}</p></div>
                  </div>
                </div>
              )}
              {loading===sel.key?<Dots/>:<ANPExplContent expl={expls[sel.key]}/>}
              {sel.condition.status==="high_risk"&&summary.unity_confirm_eligible&&<UnityConfirmBanner deadline={summary.unity_confirm_deadline}/>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ANPMobileExplorer({report, onHome}) {
  const [active,setActive]=useState(null);
  const [showFF,setShowFF]=useState(false);
  const [expls,setExpls]=useState({});
  const [ffExpl,setFfExpl]=useState(null);
  const [loading,setLoading]=useState(null);
  const sheetRef=useRef(null);
  const {patient,summary,panels,interpretation,report_meta}=report;
  const isHighRisk=summary.overall_status==="high_risk";
  function pickCondition(condition,panel){
    setShowFF(false);const key=`${panel.id}__${condition.id}`;setActive({key,condition,panel});
    if(!expls[key]){
      const panelHasHighRisk=panel.conditions.some(c=>c.id!==condition.id&&c.status==="high_risk");
      const staticKey=getANPStaticKey(panel.id,condition.id,condition.status,summary.gestation,panelHasHighRisk);
      const staticContent=staticKey?ANP_STATIC_CONTENT[staticKey]:null;
      if(staticContent){setExpls(p=>({...p,[key]:staticContent}));}
    }
  }
  async function openFF(){setActive(null);setShowFF(true);if(!ffExpl&&summary.fetal_fraction_percent){setFfExpl(STATIC_EXPLANATIONS["FETAL_FRACTION_EXPLANATION"]);}}
  const closeSheet=()=>{setActive(null);setShowFF(false);};
  return (
    <div style={{background:T.dark,minHeight:"100%",position:"relative"}}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{padding:"18px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <UnityLogo height={22}/>
        </div>
        <button onClick={onHome} style={{background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.8)",padding:"5px 12px",borderRadius:20,fontSize:11,cursor:"pointer"}}>⌂ Home</button>
      </div>
      <div style={{margin:"0 16px 4px",background:"white",borderRadius:14,overflow:"hidden",border:`0.5px solid ${T.border}`}}>
        <div style={{background:isHighRisk?T.orange:summary.overall_status==="antigen_detected"?"#D9540A":T.aqua,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:isHighRisk||summary.overall_status==="antigen_detected"?"rgba(255,255,255,0.8)":T.navy,textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 2px"}}>
              {isHighRisk?"High Risk Result":summary.overall_status==="antigen_detected"?"Antigen Detected":"Your Result"}
            </p>
            <p style={{fontSize:14,fontWeight:700,color:isHighRisk||summary.overall_status==="antigen_detected"?"white":T.navy,margin:0,lineHeight:1.2}}>{summary.headline}</p>
          </div>
          {summary.gestation==="twin"&&<span style={{fontSize:11,fontWeight:700,background:"rgba(255,255,255,0.25)",color:isHighRisk?"white":T.navy,padding:"3px 10px",borderRadius:20}}>Twins</span>}
        </div>
        <div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          {summary.fetal_sex?.map((fs,i)=>(
            <span key={i} style={{fontSize:11,color:T.dark,background:T.sky,padding:"3px 9px",borderRadius:20,fontWeight:500}}>{fs.label}: {fs.sex.charAt(0).toUpperCase()+fs.sex.slice(1)}</span>
          ))}
          {summary.fetal_fraction_percent&&(
            <button onClick={openFF} style={{fontSize:11,color:T.dark,background:T.sky,border:`0.5px solid ${T.lightAqua}`,padding:"3px 10px",borderRadius:20,cursor:"pointer",fontWeight:600}}>
              {summary.fetal_fraction_percent}% fetal fraction ›
            </button>
          )}
        </div>
      </div>
      {isHighRisk&&<div style={{margin:"8px 16px",background:"rgba(244,91,61,0.15)",border:"0.5px solid rgba(244,91,61,0.4)",borderRadius:10,padding:"10px 14px",display:"flex",gap:8}}><span style={{fontSize:14,flexShrink:0}}>🔴</span><p style={{fontSize:11,color:"#FBBDAD",margin:0,lineHeight:1.55}}>High risk result. Please speak with your healthcare provider or genetic counselor.</p></div>}
      {summary.unity_confirm_eligible&&<div style={{margin:"8px 16px",background:"rgba(82,194,207,0.1)",border:"0.5px solid rgba(82,194,207,0.3)",borderRadius:10,padding:"10px 14px",display:"flex",gap:8}}><UnityConfirmIcon size={22}/><p style={{fontSize:11,color:"rgba(255,255,255,0.85)",margin:0,lineHeight:1.55}}><strong style={{color:T.aqua}}>Unity Confirm available</strong> — draw deadline: {summary.unity_confirm_deadline}</p></div>}
      <div style={{margin:"8px 0 0",background:T.beige,borderRadius:"20px 20px 0 0",padding:"16px 16px 100px"}}>
        {panels.map(panel=>(
          <div key={panel.id} style={{marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:700,color:T.dark,textTransform:"uppercase",letterSpacing:"0.8px",margin:"0 0 6px",padding:"0 4px"}}>
              {panel.title.replace("™ NIPT","").replace("™","")}
              <span style={{color:T.textMuted,fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:11}}> · {panel.subtitle}</span>
            </p>
            {panel.note&&<p style={{fontSize:11,color:T.softBlack,margin:"0 0 8px",lineHeight:1.6,padding:"8px 10px",background:"rgba(0,0,0,0.03)",borderRadius:8,border:`0.5px solid ${T.border}`}}>{panel.note}</p>}
            <div style={{background:"white",borderRadius:12,border:`0.5px solid ${T.border}`,overflow:"hidden"}}>
              {panel.conditions.map((cond,ci)=>{
                const isHighC=cond.status==="high_risk";
                const cfg=cond.status==="not_detected_sca"?{color:"#1E7A38",label:"Not Detected"}:ANP_STATUS[cond.status]||{color:T.textMuted,label:cond.status};
                return (
                  <button key={cond.id} onClick={()=>pickCondition(cond,panel)}
                    style={{width:"100%",padding:"12px 14px",background:"white",border:"none",borderBottom:ci<panel.conditions.length-1?`0.5px solid ${T.border}`:"none",borderLeft:`3px solid ${isHighC?T.orange:cfg.color}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span style={{fontSize:13,color:T.softBlack,flex:1,lineHeight:1.35}}>{cond.name}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <span style={{fontSize:11,fontWeight:700,color:cfg.color}}>{cond.label_override||cfg.label}</span>
                      {cond.badge&&<span style={{fontSize:11,background:T.dark,color:T.aqua,fontWeight:700,padding:"2px 6px",borderRadius:10}}>{cond.badge}</span>}
                      <span style={{fontSize:14,color:T.textMuted}}>›</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {summary.follow_ups?.length>0&&(
          <div style={{background:"white",borderRadius:12,padding:"14px 16px",border:`0.5px solid ${T.border}`,marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",margin:"0 0 10px"}}>Recommended Follow-Up</p>
            {summary.follow_ups.map((fu,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
                <span style={{flexShrink:0,marginTop:1}}>{fu.type==="genetic_counseling"?<BubbleIcon size={18}/>:fu.type==="prenatal_diagnosis"?<PNDIcon size={18}/>:fu.type==="unity_confirm"?<UnityConfirmIcon size={18}/>:ANP_FU_ICONS[fu.type]||"ℹ️"}</span>
                <p style={{fontSize:12,color:T.navy,margin:0,lineHeight:1.55}}>{fu.text}</p>
              </div>
            ))}
          </div>
        )}
        <a href="tel:+16504602551" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:T.sky,borderRadius:10,border:`0.5px solid ${T.lightAqua}`,textDecoration:"none",marginBottom:16}}>
          <CustomerServiceIcon size={28}/>
          <div><p style={{fontSize:13,fontWeight:600,color:T.dark,margin:0}}>+1 (650) 460-2551</p><p style={{fontSize:11,color:T.textMuted,margin:0}}>BillionToOne / Unity support</p></div>
        </a>
        <LegalFooter/>
      </div>
      {(active||showFF)&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div onClick={closeSheet} style={{position:"absolute",inset:0,background:"rgba(2,26,38,0.6)"}}/>
          <div ref={sheetRef} style={{position:"relative",background:"white",borderRadius:"20px 20px 0 0",maxHeight:"82vh",display:"flex",flexDirection:"column",animation:"slideUp 0.28s ease-out"}}>
            <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px",flexShrink:0}}><div style={{width:36,height:4,background:T.border,borderRadius:4}}/></div>
            <div style={{padding:"0 18px 12px",borderBottom:`0.5px solid ${T.border}`,flexShrink:0,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div style={{flex:1}}>
                <p style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 3px",fontWeight:600}}>{showFF?"Fetal Fraction":active?.panel.title}</p>
                <p style={{fontSize:16,fontWeight:700,color:T.dark,margin:0,lineHeight:1.25}}>{showFF?`${summary.fetal_fraction_percent}% — What does this mean?`:active?.condition.name}</p>
                {active?.condition.status&&<div style={{marginTop:6}}><ANPStatusBadge status={active.condition.status==="not_detected_sca"?"low_risk":active.condition.status} label_override={active.condition.label_override} size="sm"/></div>}
              </div>
              <button onClick={closeSheet} style={{width:28,height:28,borderRadius:"50%",background:T.gray,border:"none",cursor:"pointer",fontSize:15,color:T.textMuted,flexShrink:0,marginTop:2}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px 18px 24px"}}>
              {active?.condition.risk_before&&(
                <div style={{background:"#F8FEFF",border:`0.5px solid ${T.lightAqua}`,borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.dark,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Your Risk</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:"white",borderRadius:6,padding:"8px 10px"}}><p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>Before NIPT</p><p style={{fontSize:14,fontWeight:600,color:T.softBlack,margin:0}}>{active.condition.risk_before}</p></div>
                    <div style={{background:"white",borderRadius:6,padding:"8px 10px",border:`1px solid ${active.condition.status==="high_risk"?T.orange:"#A8E6C0"}`}}><p style={{fontSize:10,color:T.textMuted,margin:"0 0 2px"}}>After NIPT</p><p style={{fontSize:14,fontWeight:600,color:active.condition.status==="high_risk"?T.orange:"#1E7A38",margin:0}}>{active.condition.risk_after}</p></div>
                  </div>
                </div>
              )}
              {showFF&&(!ffExpl?<Dots/>:<ANPExplContent expl={ffExpl}/>)}
              {active&&<ANPExplContent expl={expls[active.key]}/>}
              {active?.condition.status==="high_risk"&&summary.unity_confirm_eligible&&<UnityConfirmBanner deadline={summary.unity_confirm_deadline}/>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ─── ROOT ─────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
export default function UnityReportExplorerUnified() {
  const [view, setView]           = useState("desktop");
  // "home" | "carrier_select" | "carrier_explorer" | "anp_select" | "anp_explorer"
  const [screen, setScreen]       = useState("home");
  const [carrierKey, setCarrierKey] = useState("hbb_low_risk");
  const [anpKey, setAnpKey]       = useState("low_risk_twins_22q_rhd");

  const carrierReport = CARRIER_SCENARIOS[carrierKey];
  const anpReport     = ANP_SCENARIOS[anpKey];

  function goHome() { setScreen("home"); }

  function resetView(v) {
    setView(v);
    setScreen("home");
  }

  const isCarrier = screen === "carrier_explorer";
  const isANP     = screen === "anp_explorer";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.softBlack,fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* Dev toolbar */}
      <div style={{background:T.softBlack,borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"6px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
        <p style={{fontSize:11,fontWeight:600,color:T.aqua,margin:0,letterSpacing:"1px",whiteSpace:"nowrap"}}>UNITY EXPLORER</p>
        {/* View toggle */}
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.06)",borderRadius:7,padding:3}}>
          {[["desktop","🖥"],["mobile","📱"]].map(([v,ic])=>(
            <button key={v} onClick={()=>resetView(v)} style={{padding:"3px 10px",borderRadius:5,fontSize:11,border:"none",cursor:"pointer",background:view===v?"rgba(255,255,255,0.15)":"transparent",color:view===v?"white":"rgba(255,255,255,0.3)"}}>{ic} {v[0].toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
        <div style={{width:1,height:16,background:"rgba(255,255,255,0.1)"}}/>
        {/* Screen shortcuts */}
        <button onClick={goHome} style={{padding:"3px 9px",borderRadius:5,fontSize:11,border:`0.5px solid ${screen==="home"?"rgba(82,194,207,0.5)":"rgba(255,255,255,0.12)"}`,cursor:"pointer",background:screen==="home"?"rgba(82,194,207,0.1)":"transparent",color:screen==="home"?T.aqua:"rgba(255,255,255,0.4)"}}>⌂ Home</button>
        <div style={{width:1,height:16,background:"rgba(255,255,255,0.1)"}}/>
        {/* Carrier scenarios */}
        <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Carrier:</span>
        {Object.entries(CARRIER_SCENARIOS).map(([k,sc])=>(
          <button key={k} onClick={()=>{setCarrierKey(k);setScreen("carrier_explorer");}}
            style={{padding:"3px 8px",borderRadius:5,fontSize:11,border:`0.5px solid ${carrierKey===k&&isCarrier?"rgba(82,194,207,0.6)":"rgba(255,255,255,0.1)"}`,cursor:"pointer",background:carrierKey===k&&isCarrier?"rgba(82,194,207,0.1)":"transparent",color:carrierKey===k&&isCarrier?T.aqua:"rgba(255,255,255,0.35)",whiteSpace:"nowrap"}}>
            {sc.label}
          </button>
        ))}
        <div style={{width:1,height:16,background:"rgba(255,255,255,0.1)"}}/>
        {/* ANP scenarios */}
        <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.5px"}}>ANP:</span>
        {Object.entries(ANP_SCENARIOS).map(([k,sc])=>(
          <button key={k} onClick={()=>{setAnpKey(k);setScreen("anp_explorer");}}
            style={{padding:"3px 8px",borderRadius:5,fontSize:11,border:`0.5px solid ${anpKey===k&&isANP?"rgba(82,194,207,0.6)":"rgba(255,255,255,0.1)"}`,cursor:"pointer",background:anpKey===k&&isANP?"rgba(82,194,207,0.1)":"transparent",color:anpKey===k&&isANP?T.aqua:"rgba(255,255,255,0.35)",whiteSpace:"nowrap"}}>
            {sc.label}
          </button>
        ))}
        <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.15)",flexShrink:0}}>Unified Explorer</span>
      </div>

      {/* Main viewport */}
      <div style={{flex:1,overflow:"hidden"}}>
        {view==="desktop" ? (
          <div style={{height:"100%",overflow:"auto"}}>
            {screen==="home"      && <SharedHomeScreen onSelectBranch={b=>setScreen(b==="anp"?"anp_explorer":"carrier_explorer")}/>}
            {screen==="carrier_explorer" && <CarrierDesktopExplorer report={carrierReport} onHome={goHome}/>}
            {screen==="anp_explorer"     && <ANPDesktopExplorer     report={anpReport}     onHome={goHome}/>}
          </div>
        ) : (
          <div style={{height:"100%",display:"flex",alignItems:"flex-start",justifyContent:"center",background:"#CBD0D3",padding:"20px 16px",overflowY:"auto"}}>
            <div style={{width:390,minHeight:700,borderRadius:44,overflow:"hidden",border:"10px solid #111",boxShadow:"0 24px 64px rgba(0,0,0,0.4)",position:"relative",background:T.dark}}>
              <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:120,height:28,background:"#111",borderRadius:"0 0 18px 18px",zIndex:10}}/>
              <div style={{paddingTop:28,height:"100%",overflowY:"auto"}}>
                {screen==="home"             && <SharedHomeScreen onSelectBranch={b=>setScreen(b==="anp"?"anp_explorer":"carrier_explorer")} mobile/>}
                {screen==="carrier_explorer" && <CarrierMobileExplorer report={carrierReport} onHome={goHome}/>}
                {screen==="anp_explorer"     && <ANPMobileExplorer     report={anpReport}     onHome={goHome}/>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

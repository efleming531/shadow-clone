const aevumBrutalist = require('./aevum-brutalist');
const cleanMinimal = require('./clean-minimal');
const darkLuxury = require('./dark-luxury');
const assessment = require('./assessment');

const templates = {
  'aevum-brutalist': aevumBrutalist,
  'clean-minimal': cleanMinimal,
  'dark-luxury': darkLuxury,
  'aevum-brutalist-assessment': assessment,
  'clean-minimal-assessment': assessment,
  'dark-luxury-assessment': assessment,
};

function getTemplate(name) {
  return templates[name] || aevumBrutalist;
}

module.exports = { getTemplate, generateAssessmentHTML: assessment };

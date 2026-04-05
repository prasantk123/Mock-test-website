const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/mock_test_1.json', 'utf8'));

const explanations = {
  1: "NEP 2020 introduced the 5+3+3+4 structure covering ages 3-18: Foundational (5 years), Preparatory (3 years), Middle (3 years), and Secondary (4 years), replacing the earlier 10+2 system.",
  2: "Bloom's Taxonomy identifies three domains: Cognitive (knowledge), Affective (attitudes/emotions), and Psychomotor (physical skills). There is no 'Spiritual Domain' in the original taxonomy.",
  3: "The Zone of Proximal Development (ZPD) was proposed by Lev Vygotsky. It describes the gap between what a learner can do independently and what they can do with guidance.",
  4: "The Socratic Method uses a series of guided questions to stimulate critical thinking and illuminate ideas, making it ideal for developing analytical skills.",
  5: "Formative assessment is conducted during the learning process to monitor student progress and provide ongoing feedback to improve both teaching and learning.",
  6: "A good research hypothesis must be testable (can be investigated) and falsifiable (can be proven wrong). Vague, opinion-based, or unverifiable statements do not qualify.",
  7: "In research, population refers to the entire group of individuals or items that the researcher wants to study and draw conclusions about.",
  8: "A Type I error (alpha error) occurs when a researcher incorrectly rejects a true null hypothesis, essentially a 'false positive' result.",
  9: "Primary data is original data collected firsthand by the researcher through methods like interviews, surveys, observations, or experiments.",
  10: "The Likert scale is a psychometric scale commonly used in questionnaires to measure attitudes, opinions, and perceptions on a range (e.g., strongly agree to strongly disagree).",
  11: "Reading comprehension involves understanding, interpreting, and deriving meaning from written text, going beyond mere word recognition.",
  12: "A syllogism is a form of logical reasoning consisting of two premises (a major premise and a minor premise) and a conclusion drawn from them.",
  13: "Effective communication is the successful exchange of information where the receiver understands the message as intended by the sender.",
  14: "Written letters are a form of verbal (written) communication. Non-verbal communication includes body language, facial expressions, gestures, and eye contact.",
  15: "Shannon and Weaver's mathematical model of communication (1949) includes five components: source, transmitter, channel, receiver, and destination, along with the concept of noise.",
  16: "Since all roses are flowers, and some flowers fade quickly, it follows that some roses may be among those flowers that fade quickly. We cannot conclude that all or no roses fade.",
  17: "The series follows the pattern of consecutive even number differences: 4, 6, 8, 10, 12. So 30 + 12 = 42.",
  18: "Mean = Sum / Number of values. If the mean is 20 and there are 5 numbers, then Sum = 20 x 5 = 100.",
  19: "Two overlapping circles in a Venn diagram represent two sets that share some common elements (intersection) but also have unique elements.",
  20: "Using the inclusion-exclusion principle: Passed in at least one = 35 + 40 - 20 = 55. Failed in both = 60 - 55 = 5.",
  21: "Deductive reasoning draws specific conclusions from general premises. The argument moves from general statements to a specific conclusion.",
  22: "Ad hominem is a logical fallacy where one attacks the person making the argument rather than the argument itself. Modus ponens, modus tollens, and hypothetical syllogism are valid forms.",
  23: "The contrapositive of 'If P, then Q' is 'If not Q, then not P.' So if the ground is not wet, it did not rain.",
  24: "The coding pattern reverses the letters. APPLE reversed is ELPPA. Similarly, MANGO reversed is OGNAM.",
  25: "A pie chart is specifically designed to show the composition or proportion of parts that make up a whole, displaying each category as a slice.",
  26: "To find the median, arrange in order: 3, 5, 7, 8, 12, 13, 14, 18, 21. The middle value (5th of 9 numbers) is 12.",
  27: "Average = (100 + 150 + 200 + 250) / 4 = 700 / 4 = 175 units per quarter.",
  28: "Standard deviation measures the dispersion or spread of data points around the mean. Higher values indicate greater variability.",
  29: "ICT stands for Information and Communication Technology, encompassing all technologies used to handle telecommunications, broadcasting, and computing.",
  30: "Synchronous communication happens in real-time where all parties are present simultaneously. Video conferencing is synchronous; email, forums, and blogs are asynchronous.",
  31: "MOOC stands for Massive Open Online Course, large-scale online courses available to anyone with internet access, often offered by universities.",
  32: "SWAYAM (Study Webs of Active Learning for Young Aspiring Minds) is an initiative by MHRD (now MoE), Government of India, for providing free online courses.",
  33: "HTML (HyperText Markup Language) is the standard markup language used for structuring and presenting content on the World Wide Web.",
  34: "The Right of Children to Free and Compulsory Education Act (RTE) was enacted by the Parliament of India on 4 August 2009.",
  35: "Sustainable development, as defined by the Brundtland Commission (1987), aims to meet present needs without compromising future generations' ability to meet their own needs.",
  36: "The Kyoto Protocol (1997) is an international treaty that committed industrialized nations to reduce greenhouse gas emissions based on the scientific consensus on global warming.",
  37: "Solar energy is a renewable source because it is naturally replenished. Coal, natural gas, and petroleum are fossil fuels (non-renewable).",
  38: "A carbon footprint is the total amount of greenhouse gases generated by human activities, usually expressed in equivalent tons of CO2.",
  39: "UGC stands for University Grants Commission, established in 1956 as a statutory body for coordination and maintenance of standards in higher education in India.",
  40: "NAAC (National Assessment and Accreditation Council) is an organization that assesses and accredits higher education institutions in India.",
  41: "The University of Calcutta was established on 24 January 1857, making it the first modern university in South Asia.",
  42: "NEP 2020 proposes replacing UGC and AICTE with the Higher Education Commission of India (HECI) as the single overarching umbrella body for higher education.",
  43: "The Academic Bank of Credits (ABC) is a digital storehouse that allows students to store academic credits earned from different recognized institutions and transfer or redeem them.",
  44: "Nitrogen (N2) makes up about 78% of the atmosphere but is not a greenhouse gas. CO2, methane, and nitrous oxide are greenhouse gases.",
  45: "The Universal Declaration of Human Rights was adopted by the United Nations General Assembly on 10 December 1948 in Paris.",
  46: "The UGC Committee on Autonomous Colleges recommended granting autonomy to well-performing colleges to improve quality and reduce bureaucratic control.",
  47: "Daniel Goleman popularized the concept of Emotional Intelligence through his 1995 book. He identified five components: self-awareness, self-regulation, motivation, empathy, and social skills.",
  48: "Microteaching is a teacher training technique where teachers practice specific teaching skills in a controlled, scaled-down setting with a small group of students.",
  49: "The chi-square test is a statistical test used to determine whether there is a significant association between two categorical (qualitative) variables.",
  50: "Plagiarism is the practice of taking someone else's work or ideas and presenting them as your own without proper attribution or acknowledgment.",
  51: "Mode, along with mean and median, is a measure of central tendency. Range, variance, and standard deviation are measures of dispersion.",
  52: "The correlation coefficient (r) ranges from -1 to +1. A value of -1 indicates perfect negative correlation, +1 perfect positive, and 0 no correlation.",
  53: "Cloud computing delivers computing services (servers, storage, databases, networking, software) over the internet, offering on-demand access without local infrastructure.",
  54: "Article 21A of the Indian Constitution, inserted by the 86th Amendment Act (2002), makes education a fundamental right for children aged 6-14 years.",
  55: "Noise and distractions are the most significant barriers to classroom communication as they directly interfere with message transmission and reception.",
  56: "Inclusive education means all learners, including those with disabilities or special needs, learn together in mainstream educational settings with appropriate support.",
  57: "Systematic sampling involves selecting every kth individual from a list or population. Selecting every 10th individual is a classic example of this method.",
  58: "A book is used for reading, just as a fork is used for eating. This is a functional analogy where an object is paired with its primary purpose.",
  59: "To convert 10 to binary: 10/2=5 R0, 5/2=2 R1, 2/2=1 R0, 1/2=0 R1. Reading remainders bottom-up: 1010.",
  60: "The Paris Agreement was adopted on 12 December 2015 at COP21, aiming to limit global warming to well below 2 degrees C above pre-industrial levels."
};

data.questions.forEach(q => {
  if (explanations[q.id]) {
    q.explanation = explanations[q.id];
  }
});

fs.writeFileSync('public/data/mock_test_1.json', JSON.stringify(data, null, 2) + '\n');
console.log('Added explanations to', data.questions.filter(q => q.explanation).length, 'questions');

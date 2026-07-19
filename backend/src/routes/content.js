import { Router } from 'express';
import storage from '../services/storage.js';

const router = Router();

// GET /api/content/testimonials — Get testimonials
router.get('/testimonials', (req, res) => {
  const testimonials = [
    {
      id: 1,
      name: 'Amelia C.',
      role: 'Cat Owner',
      text: 'I thought I\'d never see my cat again. Within hours of reaching out, a drone pilot was here, in the air — and we found her hiding under a shed. Absolutely incredible team and organization.',
      image: null,
    },
    {
      id: 2,
      name: 'Jeff U.',
      role: 'Dog Owner',
      text: 'Our dog ran off during a fireworks show. I submitted my info at midnight — by the next morning, a pilot had already started searching. We were reunited later that day. I still can\'t believe it.',
      image: null,
    },
    {
      id: 3,
      name: 'Holly D.',
      role: 'Horse Owner',
      text: 'One of our horses broke through the fence and vanished into the woods. A drone team showed up the next morning, found her within minutes, and even helped guide her back. Total lifesavers.',
      image: null,
    },
    {
      id: 4,
      name: 'Josh W.',
      role: 'Pet Owner',
      text: 'There are not enough words to describe the amount of gratitude my husband and I had for Josh. Within 5 minutes of that call and conversation, Josh was in his car to make the 2 hour commute to help us find our fur baby.',
      image: null,
    },
  ];

  res.json({ testimonials });
});

// GET /api/content/faqs — Get FAQs
router.get('/faqs', (req, res) => {
  const faqs = [
    {
      id: 1,
      question: 'What if there\'s no pilot near me?',
      answer: 'We\'re adding new drone pilots every week. If no one shows up near your location, hit the "Request Assistance" button and we\'ll reach out to nearby pilots on your behalf — or notify you when someone\'s available.',
    },
    {
      id: 2,
      question: 'Is this a free service?',
      answer: 'No, but it\'s affordable compared to what\'s at stake. Our pilots use high-end thermal drones that cost thousands, and they\'re trained to help in real-world emergencies. Each pilot sets their own pricing, and you\'ll see it when you click their profile.',
    },
    {
      id: 3,
      question: 'How quickly can someone help me?',
      answer: 'It depends on location and availability. Many of our pilots respond within an hour or two. Some may need to drive a bit to reach you. You\'ll be able to message them directly once you find a good match.',
    },
    {
      id: 4,
      question: 'What kind of pets can drones help find?',
      answer: 'Most often, dogs and cats — but we\'ve helped recover horses, goats, and pigs. If it\'s warm-blooded and recently lost, thermal drones give you a fighting chance.',
    },
    {
      id: 5,
      question: 'Will the drone hurt or scare my pet?',
      answer: 'Not likely. Drones usually fly at a safe distance and help locate — not chase. If the drone needs to get close, pilots will communicate with you first. Some can use a loudspeaker to call your pet gently.',
    },
    {
      id: 6,
      question: 'What tech do the pilots use?',
      answer: 'Many of our pilots fly thermal drones with zoom cameras, spotlights, loudspeakers, and even live video feeds. Most pilots list their equipment on their profile so you can see exactly what they offer.',
    },
    {
      id: 7,
      question: 'Can I talk to someone before booking?',
      answer: 'Yes. You can message any pilot directly from their profile. If you\'re overwhelmed or unsure who to contact, hit "Request Assistance" and we\'ll try to connect you with someone who can help.',
    },
  ];

  res.json({ faqs });
});

export default router;

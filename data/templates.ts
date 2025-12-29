export interface ScriptTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  // --- Quick Relax ---
  {
    id: 'quick-5',
    category: 'Quick Relaxation',
    title: '5-Minute Reset',
    tags: ['Relax', 'Breathing'],
    content: `[INDUCTION]
Take a deep breath in... hold it... and release. [PAUSE 3s]
Close your eyes and focus on the sensation of gravity anchoring you down.
With every breath out, say to yourself: "I am releasing."

[DEEPENER]
Imagine a wave of relaxation starting at the top of your head {{NAME}}.
It washes down over your forehead, your eyes, your jaw.
[REPEAT 3x] Down... deeper down... relaxing more. [/REPEAT]

[WORK]
You are stepping out of the stream of time.
For these few minutes, there is nowhere to go, nothing to do.
Just {{GOAL}}.
Feel a color, perhaps {{COLOR}}, wrapping around you like a warm blanket.

[AWAKENING]
3... Feeling energy return.
2... Taking a deep breath.
1... Eyes open, awake and refreshed.`
  },
  
  // --- Sleep ---
  {
    id: 'sleep-stairs',
    category: 'Sleep Inductions',
    title: 'The 10-Step Staircase',
    tags: ['Sleep', 'Visual'],
    content: `[INDUCTION]
Let your body sink into the mattress.
The day is done. The world has turned off.
You are safe here.

[DEEPENER]
Visualize a beautiful staircase with 10 steps.
They lead down to a place of perfect rest.
10... Stepping down, letting go.
9... Deeper and deeper.
8... Muscles becoming heavy, so heavy.
[IF ANXIETY]
Imagine any worries are heavy coats you are taking off and leaving at the top of the stairs.
[/IF]
7... 6... 5... Halfway down.
4... 3... drifting...
2... 1... All the way down.

[WORK]
You are now in a garden of sleep.
It is soft, dark, and quiet.
Sleep is not something you do, it is something you allow.
Allow it now.`
  },
  {
    id: 'sleep-blackboard',
    category: 'Sleep Inductions',
    title: 'The Eraser Technique',
    tags: ['Sleep', 'Mental Clearing'],
    content: `Imagine a blackboard in front of you.
On it, written in chalk, is the word "AWAKE".
Pick up an eraser.
Slowly, methodically, erase the letter 'A'.
[PAUSE 5s]
Now erase the 'W'.
[PAUSE 5s]
Fading away... erase the 'A'.
Gone.
Erase the 'K'.
Erase the 'E'.
Now, there is only the dark, empty board.
Dark... and quiet.`
  },

  // --- Anxiety ---
  {
    id: 'anxiety-interrupt',
    category: 'Anxiety Interrupter',
    title: 'The Control Room',
    tags: ['Anxiety', 'Control', 'Mechanical'],
    content: `[INDUCTION]
Focus on your hands. Clench them tight into fists. Tighter.
Now release. [PAUSE 3s].
Feel the difference between tension and relaxation.

[WORK]
Imagine you are walking down a corridor into the Control Room of your mind.
In the center, there is a large dial labeled "ANXIETY".
It might be set to 7 or 8 right now.
Walk over to it. Put your hand on the dial.
It feels cool to the touch.
Turn it down.
Down to 5.
Down to 3.
Down to 1.
Notice how your breathing changes as the dial goes down.
[REPEAT 3x] I am in control. My mind obeys my command. [/REPEAT]`
  },

  // --- Pain ---
  {
    id: 'pain-dial',
    category: 'Pain Management',
    title: 'The Dimmer Switch',
    tags: ['Pain', 'Dissociation'],
    content: `[INDUCTION]
Focus on a point on the ceiling. Stare at it until your eyes grow heavy.
Close them.

[WORK]
Visualize the nerves in your body as glowing fiber-optic cables.
The area of discomfort is glowing bright red.
Find the dimmer switch in your mind.
Slowly, slide that dimmer switch down.
The red light turns to orange...
Then to a soothing cool blue {{COLOR}}.
The signal is fading.
It's just a distant sensation now.
Signal fading... fading... gone.`
  },

  // --- Confidence ---
  {
    id: 'conf-anchor',
    category: 'Confidence',
    title: 'The Circle of Excellence',
    tags: ['Confidence', 'NLP', 'Anchoring'],
    content: `[INDUCTION]
Breathe in power. Breathe out doubt.

[WORK]
Imagine a circle on the floor in front of you.
This is your Circle of Excellence.
Fill it with a bright, golden light.
Fill it with the memory of a time you felt totally unstoppable.
Step into the circle.
Feel that power rushing through you.
[ACTION] Press your thumb and finger together now. [/ACTION]
This is your trigger.
Whenever you touch these fingers, you return to this circle.
You are strong. You are capable.`
  }
];

export const CATEGORIES = Array.from(new Set(SCRIPT_TEMPLATES.map(t => t.category)));

export interface ScriptTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
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
    id: 'conditioning-blank',
    category: 'Conditioning',
    title: 'Total Reset Protocol',
    tags: ['Reset', 'Blank', 'Trigger'],
    content: `[INDUCTION]
Focus on the center of your screen.
Visualize a loading bar filling up.
0%... 20%... 50%...
With every percent, your thoughts become heavier.
[DEEPENER]
System shutting down.
Closing all active windows in your mind.
Closing 'Worry.exe'... Done.
Closing 'Planning.exe'... Done.
[WORK]
You are now in Safe Mode.
The only input you accept is my voice.
[ACTION] Touch your forehead. [/ACTION]
This is your reset button.
Whenever you touch this spot, you return to Safe Mode.
Blank. Open. Ready to be programmed.
[AWAKENING]
Rebooting system in 3... 2... 1...
System online.`
  },
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
  },
  {
    id: 'sensory-surrender',
    category: 'Deep Surrender',
    title: 'The Velvet Rope',
    tags: ['Sensory', 'Obedience', 'Trance'],
    content: `[INDUCTION]
Focus on the sound of my voice. It is the only thing that matters right now.
Let the world outside fade away.
Visualize a heavy velvet curtain surrounding you.
It shuts out the light. It shuts out the noise.
It shuts out your thoughts.
[DEEPENER]
With every breath, the curtain draws tighter, closer.
You feel safe. You feel held. You feel owned by this moment.
10... Sinking down into the texture of the velvet.
9... Soft, heavy, and warm.
8... Your thoughts are becoming slow. Sticky. Hard to hold onto.
[WORK]
Imagine a golden cord connected to the center of your chest.
A cord of pure pleasure and obedience.
I hold the other end.
When I pull it gently, you feel a wave of warmth wash over you.
Pulling now... feel that warmth?
It starts in your chest and spreads down... deeper...
[ACTION] Touch your collarbone now. [/ACTION]
This is your button.
Whenever you touch it, you feel that tug. You feel that drop.
You surrender control. You accept the pleasure of letting go.
Drop.
[AWAKENING]
Floating back up, keeping that cord connected.
3... 2... 1... Awake, but still tethered.`
  },
  {
    id: 'fantasy-cage',
    category: 'Fantasy',
    title: 'The Golden Cage',
    tags: ['Safety', 'Control', 'Fantasy'],
    content: `[INDUCTION]
Imagine you are walking through a mist. It is warm, comforting, and sweet-smelling.
In front of you, a golden cage appears.
The door is open. It is inviting.
[DEEPENER]
You step inside. It is not a trap, but a sanctuary.
The door closes with a soft click.
You are safe from the world. You don't have to make any decisions here.
[WORK]
Feel the bars. They are solid gold. Cool to the touch.
Outside the cage, the world spins and rushes.
Inside, time is still. You are an exhibit of perfect stillness.
[ACTION] Clasp your hands together. [/ACTION]
As you clasp your hands, you lock yourself in this state of peace.
You are protected. You are held. You are precious.
[AWAKENING]
The door unlocks. You can step out whenever you choose.
But the feeling of safety remains.`
  }
];

export const CATEGORIES = Array.from(new Set(SCRIPT_TEMPLATES.map(t => t.category)));

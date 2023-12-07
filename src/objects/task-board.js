AFRAME.registerComponent('task-board', {

  init() {

    this.tasks = [
      {text: "Try to catch a snowflake in your mouth",
       event: "task-catch-snowflake"
     },
     {text: "Move the snowman's nose",
      event: "task-move-nose"
     },
     {text: "Re-arrange the Christmas tree baubles",
      event: "task-move-baubles"
    },
    {text: "Play the icicle xylophone",
     event: "task-xylophone"
    },
    {text: "Roll a bauble down the marble run",
     event: "task-marble-run"
    },
    {text: "Look closely at the reflections in a bauble",
     event: "task-close-look"
    },
    {text: "Make a snowball",
     event: "task-snowball"
    },
    {text: "Make a big snowball",
     event: "task-big-snowball"
    },
    {text: "Re-arrange the marble run",
     event: "task-change-marble-run"
    },
    {text: "Knock down a penguin",
     event: "task-knock-penguin"
    },
    {text: "Make a stack of at least 3 presents",
     event: "task-stack-presents"
    },
    {text: "Turn the music volume up or down",
     event: "task-change-volume"
    },
    {text: "Make a chain of 10 snowballs",
     event: "task-stick-snowballs"
    },
    {text: "Paint 5 snowballs",
     event: "task-paint-snowballs"
    },
    {text: "Move a perimeter fence post",
     event: "task-move-fence-post"
    },
    {text: "Re-arrange the alphabet blocks",
     event: "task-move-alphabet"
    },
    {text: "Paint all the icicles different colors",
     event: "task-paint-icicles"
    },
    {text: "Re-set the bowling alley",
     event: "task-reset-bowling"
    },
    {text: "Make a snow angel",
     event: "task-snow-angel"
    },
    {text: "Get a STRIKE in the bowling alley",
     event: "task-strike-bowling"
    },
    {text: "Hoist the star 10 meters into the air",
     event: "task-high-star"
    },
    {text: "Play 'We wish you a Merry Christmas'",
     event: "task-merry-christmas"
    },
    {text: "Make a 3 foot long carrot!",
     event: "task-large-carrot"
    },
    {text: "Complete all these tasks",
     event: "task-all-tasks"
    },
    ]

    this.taskComplete = this.taskComplete.bind(this);

    this.board = document.createElement('a-box');
    this.board.setAttribute('height', 4);
    this.board.setAttribute('width', 1.5);
    this.board.setAttribute('depth', 0.1);
    this.board.setAttribute('ammo-body', 'type:static');
    this.board.setAttribute('ammo-shape', 'type:box');
    this.board.setAttribute('color', "#5C4033");
    this.el.appendChild(this.board);

    this.text = document.createElement('a-text');
    this.text.setAttribute('color', 'white')
    this.text.setAttribute('width', 1.3)
    this.text.setAttribute('baseline', 'top')
    this.text.setAttribute('white-space', 'pre')
    this.text.object3D.position.set(-0.65, 1.9, 0.05);
    // 100B is unicode blank non-whitespace character.
    const text = this.tasks.reduce((a, task, index) => a + `\n\n\u200B\t\t${index + 1}. ${task.text}`, "");
    const title = "WINTER WONDERLAND ADVENT TASK LIST\n";
    const hints = `\n\nHINTS\n
                   Grip on either hand to grab objects\n
                   Hold grip near the ground to make a snowball\n
                   Left trigger to teleport\n
                   Trigger to activate the magic paintbrush`;
    this.text.setAttribute('value', title + text + hints);
    this.el.appendChild(this.text);

    this.checks = [];

    this.tasks.forEach((task, index) => {
      const check = document.createElement('a-entity');

      check.setAttribute('id', `task-check-${index}`);
      check.object3D.position.set(-0.6, (1.7 - index * 0.12), 0.05);
      check.object3D.scale.set(0.7, 0.7, 0.7);
      check.object3D.visible = false;
      check.setAttribute('instanced-mesh-member', "mesh:#task-check-mesh");
      this.el.appendChild(check);
      this.checks.push(check);

      this.el.sceneEl.addEventListener(task.event, () => this.taskComplete(index));
    })

    this.tasksComplete = 0;
  },

  taskComplete(taskNumber) {
    console.log(taskNumber + " complete");

    if (!this.checks[taskNumber].object3D.visible) {

      this.checks[taskNumber].object3D.visible = true;
      this.checks[taskNumber].emit("object3DUpdated");
      this.tasksComplete++;
    }

    if (this.tasksComplete === 23) {
      this.el.sceneEl.emit("task-all-tasks")
    }

    if (this.tasksComplete === 24) {

      // Party time!  Set board to gold.
      this.board.setAttribute("color", "goldenrod");
      this.board.setAttribute("metalness", 0.7);
      this.board.setAttribute("roughness", 0.3);
      this.board.setAttribute("material", "envMap:#env");

      // play cheers.
      const cheers = document.getElementById("cheers");
      cheers.components['sound'].playSound();

      //spawn trophy.

      if (!this.spawnedTrophy) {
        this.spawnTrophy();
        this.spawnedTrophy = true;
      }
    }
  },

  spawnTrophy() {

    const trophy = document.createElement('a-entity');
    trophy.setAttribute("mixin", "trophy")
    trophy.setAttribute("material", "color:goldenrod;metalness:0.7;roughness:0.3;envMap:#env");
    trophy.setAttribute('movement', "type:grabbable; stickiness:stickable; initialState:dynamic");
    trophy.setAttribute("ammo-shape", "type:hull");
    trophy.object3D.position.set(0, 0.5, 0);

    const playArea = document.getElementById("play-area");

    playArea.appendChild(trophy);
  }
});

AFRAME.registerGeometry('check', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = [];
    // 2 cylinders, one tall and thin for the hat, one short and wider for the brim.
    geometries.push(new THREE.BoxGeometry(0.05, 0.05, 0.05));
    geometries.push(new THREE.BoxGeometry(0.15, 0.05, 0.05));
    geometries[1].translate(0.05, -0.05, 0);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    this.geometry.rotateZ(Math.PI/4);

    recenterGeometry(this.geometry);
  }
});
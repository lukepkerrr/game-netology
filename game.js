`use strict`;
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(childOfVector) {
    if (! (childOfVector instanceof Vector)) {
      throw new Error (`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(this.x + childOfVector.x, this.y + childOfVector.y);
  }
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}
class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if ((position instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
      this.pos = position;
      this.size = size;
      this.speed = speed;
      this.actor = `actor`;
    } else {
      throw new Error (`Ошибка в Actor`);
    }
  }
  act() {
    
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return this.actor;
  }
  isIntersect(movingObject){
    if (!(movingObject instanceof Actor)){
      throw new Error ('Ошибка в isIntersect');
    }
    if (movingObject === this){
      return false;
    }
    return this.top < movingObject.bottom && this.bottom > movingObject.top && this.right > movingObject.left && this.left < movingObject.right;
  }
}
class Level {
  constructor(grid, actors){
    if(grid){
      this.grid = grid;
      this.height = grid.length;
      this.width = Math.max( ...grid.map(function (el) {
        return el.length;
      }));
    } else {
      this.height = 0;
      this.width = 0;
    }
    if(actors){
      this.actors = actors;
      this.player = (this.actors.find(function (el) {
        return (el.type === 'player');
      }));
    }
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    return ((this.status !== null)  && (this.finishDelay < 0));
  }
  actorAt(objectForCheck) {
    if ((objectForCheck === undefined) || !(objectForCheck instanceof Actor)) {
      throw new Error (`Ошибка в actorAt`);
    }
    if (this.actors) {
      for(let actor of this.actors){
        if (objectForCheck.isIntersect(actor)){
          return actor;
        }
      }
    } else {
      return undefined;
    }
  }
 obstacleAt(moveTo, size) {
    if ( !(moveTo instanceof Vector) || !(size instanceof Vector) ){
      throw new Error ('Ошибка в obstacleAt');
    }
    const newActor = new Actor(moveTo, size);
    if (newActor.bottom > this.height){
      return 'lava';
    } else if ( (newActor.left < 0) || (newActor.right > this.width) || (newActor.top < 0) ){
      return 'wall';
    }
    const i = Math.floor(newActor.top);
    const iTo = Math.ceil(newActor.bottom);
    const j = Math.floor(newActor.left);
    const jTo = Math.ceil(newActor.right);
    for(let I = i; I < iTo; I++){
      for(let J = j; J < jTo; J++){
        if(this.grid[I][J]){
          const obstalce = this.grid[I][J];
          return obstalce;
        }
      }
    }
  }
  removeActor(objectForDelete){
    this.actors.splice((this.actors).findIndex(function (el, i) {
      return (el === objectForDelete);
    }), 1);
  }
  noMoreActors(typeOfActor) {
    if (!(this.actors)){
      return true;
    }
    return !( this.actors.find(function (el) {
      return (el.type === typeOfActor);
    }));
  }
  playerTouched(type, touchedObject) {
    if (type === `lava` || type === `fireball` && this.status === null) {
      this.status = `lost`;
    } else if (type === `coin` && this.status === null) {
      this.removeActor(touchedObject);
      if (this.noMoreActors(`coin`)) {
        this.status = `won`;
      }
    }
  }
}
class LevelParser {
  constructor (dictionary) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(symb) {
    if (symb && this.dictionary) {
      if (this.dictionary[symb]) {
        return this.dictionary[symb];
      } else {
        return undefined;
      }
    }
  }
  obstacleFromSymbol(symb) {
    if (symb === `x`) {
      return `wall`;
    } else if (symb === `!`) {
      return `lava`;
    } else {
      return undefined;
    }
  }
  createGrid(arr) {
    if(!arr)
      return;
    return arr.map((row)=>{
      return row.split('').map((item)=>{
        return this.obstacleFromSymbol(item);
      });
    });
  }
  createActors(arr){
    if(!arr)
      return;
    if(!this.dictionary)
      return [];
    const actors = [];
    const self = this;
    arr.forEach( function (row, i) {
      row.split('').forEach( function(item, j){
        if(typeof self.actorFromSymbol(item) === 'function') {
          if ((self.actorFromSymbol(item)).prototype instanceof Actor || (self.actorFromSymbol(item)) === Actor) {
            const Creator = self.actorFromSymbol(item);
            actors.push(new Creator(new Vector(j, i)));
          }
        }
      });
    });
    return actors;
  }
  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}
class Player extends Actor {
  constructor (position = new Vector(0, 0), size = new Vector(0.8, 1.5), speed = new Vector(0, 0)) {
    const changedPos = position.plus(new Vector(0, -0.5));
    super(changedPos, size);
    this.actor = `player`;
    }
}
class Fireball extends Actor {
  constructor (position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
    this.actor = `fireball`;
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, level) {
    const newPosition = this.getNextPosition(time);
    if (level.obstacleAt(newPosition, this.size)){
      this.handleObstacle();
    } else {
      this.pos = newPosition;
    }
  }
}
class HorizontalFireball extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position);
    this.speed = new Vector(2, 0);
  }
}
class VerticalFireball extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position);
    this.speed = new Vector(0, 2);
  }
}
class FireRain extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position, new Vector(0, 3));
    this.start = position;
  }
  handleObstacle() {
    this.pos = this.start;
  }
}
class Coin extends Actor {
  constructor (position = new Vector(0, 0)) {
    super(position.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.posForSpring = position;
    this.actor = `coin`;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }
  updateSpring(time = 1) {
    this.spring = this.spring + (this.springSpeed * time);
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    const spring = this.posForSpring.plus(this.getSpringVector());
    return spring.plus(new Vector(0.2, 0.1));
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}
const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
};
const parser = new LevelParser(actorDict);
loadLevels()
  .then((levels) => {
    let scheme;
    try{
      scheme = JSON.parse(levels);
      runGame(scheme, parser, DOMDisplay);
    } catch (err){
      console.error(err);
    }
  });
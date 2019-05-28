const enableTransition = () => {
  this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${
    this.config.easing
  }`;
  this.sliderFrame.style.transition = `all ${this.config.duration}ms ${
    this.config.easing
  }`;
};

export { enableTransition };

class Swiper {
  constructor(options) {
    this.config = Swiper.mergeSettings(options);

    this.selector =
      typeof this.config.selector === 'string'
        ? document.querySelector(this.config.selector)
        : this.config.selector;

    if (this.selector === null) {
      throw new Error('Something wrong with your selector.');
    }

    this.perPage = this.config.perPage;

    this.selectorWidth = this.selector.offsetWidth;
    this.innerElements = [].slice.call(this.selector.children);
    // 防止填写不正确的startIndex
    this.currentSlide = this.config.loop
      ? this.config.startIndex % this.innerElements.length
      : Math.max(
          0,
          Math.min(
            this.config.startIndex,
            this.innerElements.length - this.perPage
          )
        );
    this.transformProperty = 'transform';

    // bind events
    [
      'resizeHandler',
      'touchstartHandler',
      'touchendHandler',
      'touchmoveHandler',
      'mousedownHandler',
      'mouseupHandler',
      'mouseleaveHandler',
      'mousemoveHandler',
      'clickHandler'
    ].forEach(method => {
      this[method] = this[method].bind(this);
    });

    this.init();
  }

  init() {
    this.attachEvents();

    this.selector.style.overflow = 'hidden';
    this.selector.style.direction = 'ltr';

    // build a frame and slide to a currentSlide
    this.buildSliderFrame();
  }

  attachEvents() {
    window.addEventListener('resize', this.resizeHandler);
    // 追踪pointer
    this.pointerDown = false;
    this.drag = {
      startX: 0,
      endX: 0,
      startY: 0,
      letItGo: null,
      preventClick: false
    };

    // Touch events
    this.selector.addEventListener('touchstart', this.touchstartHandler);
    this.selector.addEventListener('touchend', this.touchendHandler);
    this.selector.addEventListener('touchmove', this.touchmoveHandler);

    // Mouse events
    this.selector.addEventListener('mousedown', this.mousedownHandler);
    this.selector.addEventListener('mouseup', this.mouseupHandler);
    this.selector.addEventListener('mouseleave', this.mouseleaveHandler);
    this.selector.addEventListener('mousemove', this.mousemoveHandler);

    // Click
    this.selector.addEventListener('click', this.clickHandler);
  }

  buildSliderFrame() {
    const widthItem = this.selectorWidth / this.perPage;
    const itemsToBuild = this.config.loop
      ? this.innerElements.length + 2 * perPage
      : this.innerElements.length;

    this.sliderFrame = document.createElement('div');
    this.sliderFrame.style.width = `${widthItem * itemsToBuild * 0.8}px`;
    this.enableTransition();
    this.selector.style.cursor = '-webkit-grab';

    // const docFragment = document.createDocumentFragment();
    const docFragment = document.createElement('div');
    docFragment.style.display = 'flex';

    if (this.config.loop) {
      for (
        let i = this.innerElements.length - this.perPage;
        i < this.innerElements.length;
        i++
      ) {
        const element = this.buildSliderFrameItem(
          this.innerElements[i].cloneNode(true)
        );
        docFragment.appendChild(element);
      }
    }
    for (let i = 0; i < this.innerElements.length; i++) {
      const element = this.buildSliderFrameItem(this.innerElements[i]);
      docFragment.appendChild(element);
    }
    if (this.config.loop) {
      for (let i = 0; i < this.perPage; i++) {
        const element = this.buildSliderFrameItem(
          this.innerElements[i].cloneNode(true)
        );
        docFragment.appendChild(element);
      }
    }

    this.sliderFrame.appendChild(docFragment);

    // clear selector(just in case something is there)
    this.selector.innerHTML = '';
    this.selector.appendChild(this.sliderFrame);

    this.slideToCurrent();
  }

  buildSliderFrameItem(elm) {
    const elementContainer = document.createElement('div');
    // elementContainer.style.cssFloat = 'left';
    // elementContainer.style.float = 'left';
    // elementContainer.style.width = `${
    //   this.config.loop
    //     ? 100 / (this.innerElements.length + this.perPage * 2)
    //     : 100 / this.innerElements.length
    // }%`;
    elementContainer.appendChild(elm);
    return elementContainer;
  }

  slideToCurrent(enableTransition) {
    const currentSlide = this.config.loop
      ? this.currentSlide + this.perPage
      : this.currentSlide;
    const offset = -1 * currentSlide * (this.selectorWidth / this.perPage);

    if (enableTransition) {
      // This one is tricky, I know but this is a perfect explanation:
      // https://youtu.be/cCOL7MC4Pl0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.enableTransition();
          this.sliderFrame.style.transform = `translate3d(${offset}px, 0, 0)`;
        });
      });
    } else {
      this.sliderFrame.style.transform = `translate3d(${offset}, 0, 0)`;
    }
  }

  resizeHandler() {}

  touchstartHandler(e) {
    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.touches[0].pageX;
    this.drag.startY = e.touches[0].pageY;
  }

  touchendHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.enableTransition();
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }

  touchmoveHandler(e) {
    e.stopPropagation();

    if (this.drag.letItGo === null) {
      this.drag.letItGo =
        Math.abs(this.drag.startY - e.touches[0].pageY) <
        Math.abs(this.drag.startX - e.touches[0].pageX);
    }

    if (this.pointerDown && this.drag.letItGo) {
      e.preventDefault();
      this.drag.endX = e.touches[0].pageX;
      this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;

      const currentSlide = this.config.loop
        ? this.currentSlide + this.perPage
        : this.currentSlide;
      const currentOffset = currentSlide * (this.selectorWidth / this.perPage);
      const dragOffset = this.drag.endX - this.drag.startX;
      const offset = currentOffset - dragOffset;
      this.sliderFrame.style.transform = `translate3d(-${offset}px, 0, 0)`;
    }
  }

  mousedownHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.pageX;
  }

  mouseupHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.selector.style.cursor = '-webkit-grab';
    this.enableTransition();
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }

  mouseleaveHandler(e) {
    e.preventDefault();
    if (this.pointerDown) {
      this.drag.endX = e.pageX;
      this.selector.style.cursor = '-webkit-grabbing';
      this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;

      const currentSlide = this.config.loop
        ? this.currentSlide + this.perPage
        : this.currentSlide;
      const currentOffset = currentSlide * (this.selectorWidth / this.perPage);
      const dragOffset = this.drag.endX - this.drag.startX;
      const offset = currentOffset - dragOffset;
      this.sliderFrame.style.transform = `translate3d(-${offset}px, 0, 0)`;
    }
  }

  mousemoveHandler(e) {
    if (this.pointerDown) {
      this.pointerDown = false;
      this.selector.style.cursor = '-webkit-grab';
      this.drag.endX = e.pageX;
      this.drag.preventClick = false;
      this.enableTransition();
      this.updateAfterDrag();
      this.clearDrag();
    }
  }

  clickHandler(e) {
    if (this.drag.preventClick) {
      e.preventDefault();
    }
    this.drag.preventClick = false;
  }

  updateAfterDrag() {
    const movement = -1 * (this.drag.endX - this.drag.startX);
    const movementDistance = Math.abs(movement);
    const howManySliderToSlide = 1;

    const slideToNegativeClone =
      movement > 0 && this.currentSlide - howManySliderToSlide < 0;
    const slideToPositiveClone =
      movement < 0 &&
      this.currentSlide + howManySliderToSlide >
        this.innerElements.length - this.perPage;

    if (
      movement > 0 &&
      movementDistance > this.config.threshold &&
      this.innerElements.length > this.perPage
    ) {
      this.prev(howManySliderToSlide);
    } else if (
      movement < 0 &&
      movementDistance > this.config.threshold &&
      this.innerElements.length > this.perPage
    ) {
      this.next(howManySliderToSlide);
    }

    this.slideToCurrent(slideToNegativeClone || slideToPositiveClone);
  }

  prev(howManySlides = 1) {
    // early return when there is nothing slide
    if (this.innerElements.length <= this.perPage) {
      return;
    }

    const beforeChange = this.currentSlide;

    if (this.config.loop) {
      const isNewIndexClone = this.currentSlide - howManySlides < 0;
      if (isNewIndexClone) {
        // TODO:
      }
    } else {
      this.currentSlide = Math.max(this.currentSlide - howManySlides, 0);
    }

    if (beforeChange !== this.currentSlide) {
      this.slideToCurrent(this.config.loop);
    }
  }

  next(howManySlides = 1) {
    if (this.innerElements.length <= this.perPage) {
      return;
    }

    const beforeChange = this.currentSlide;

    if (this.config.loop) {
      // TODO:
    } else {
      this.currentSlide = Math.min(
        this.currentSlide + howManySlides,
        this.innerElements.length - this.perPage
      );
    }

    if (beforeChange !== this.currentSlide) {
      this.slideToCurrent(this.config.loop);
    }
  }

  static mergeSettings(options) {
    const settings = {
      selector: '.swiper',
      duration: 200,
      easing: 'ease-out',
      perPage: 1,
      startIndex: 0,
      threshold: 20,
      loop: false
    };

    const userSttings = options;
    for (const attrname in userSttings) {
      settings[attrname] = userSttings[attrname];
    }

    return settings;
  }

  enableTransition() {
    this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${
      this.config.easing
    }`;
    this.sliderFrame.style.transition = `all ${this.config.duration}ms ${
      this.config.easing
    }`;
  }

  clearDrag() {
    this.drag = {
      startX: 0,
      endX: 0,
      startY: 0,
      letItGo: null,
      preventClick: this.drag.preventClick
    };
  }
}

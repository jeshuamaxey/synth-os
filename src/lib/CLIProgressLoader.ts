export interface CLIProgressLoaderOptions {
  onProgress: (progress: number) => void;
  onComplete: () => void;
  minProgress?: number;
  maxProgress?: number;
}

export class CLIProgressLoader {
  private _progress: number = 0;
  private _onProgress: (progress: number) => void;
  private _minProgress: number;
  private _maxProgress: number;
  private _onComplete: () => void;

  constructor({
    onProgress,
    onComplete,
    minProgress = 0,
    maxProgress = 1,
  }: CLIProgressLoaderOptions) {
    this._progress = 0;
    this._onProgress = onProgress;
    this._minProgress = minProgress;
    this._maxProgress = maxProgress;
    this._onComplete = onComplete;
  }

  set progress(progress: number) {
    if(progress < 0 || progress > 1) {
      throw new Error("Progress must be between 0 and 1");
    }

    const p = this._minProgress + (this._maxProgress - this._minProgress) * progress;

    this._progress = p;
    this._onProgress(p);

    if(p === 1) {
      this._onComplete();
    }
  }

  get progress() {
    return this._progress;
  }
}


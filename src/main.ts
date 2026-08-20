const enum Rec709 {
	R = 0.2126,
	G = 0.7152,
	B = 0.0722,
}

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const saveButton = document.getElementById('saveButton') as HTMLButtonElement;

const grayCutoffSlider = document.getElementById('grayCutoffSlider') as HTMLInputElement;

const grayCutoffValue = document.getElementById('grayCutoffValue') as HTMLSpanElement;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d')!;

const placeholder = document.getElementById('placeholder') as HTMLDivElement;

// moving the slider always starts from the original rather than repeatedly modifying pixels
let imageDataOriginal: ImageData | null = null;

imageInput.addEventListener('change', () => {
	const file = imageInput.files?.[0];

	if (!file) {
		return;
	}

	loadImage(file);
});

function loadImage(file: File): void {
	const image = new Image();

	image.onload = () => {
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;

		canvasContext.clearRect(0, 0, canvas.width, canvas.height);

		canvasContext.drawImage(image, 0, 0);

		// save original
		imageDataOriginal = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

		canvas.style.display = 'block';
		placeholder.style.display = 'none';

		saveButton.disabled = false;

		updateImage();

		URL.revokeObjectURL(image.src);
	};

	image.src = URL.createObjectURL(file);
}

grayCutoffSlider.addEventListener('input', () => {
	updateImage();
});

function updateImage(): void {
	const grayCutoff = +grayCutoffSlider.value;
	grayCutoffValue.textContent = `${grayCutoff}`;

	if (!imageDataOriginal) {
		return;
	}

	// copy to preserve original
	const imageDataCopy = new ImageData(
		new Uint8ClampedArray(imageDataOriginal.data),
		imageDataOriginal.width,
		imageDataOriginal.height,
	);

	const pixels: Uint8ClampedArray = imageDataCopy.data;

	if (pixels.length % 4 > 0) {
		return;
	}

	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		// no change to alpha

		// get grayscale equivalent of pixel
		let value = Rec709.R * r + Rec709.G * g + Rec709.B * b;

		// invert
		value = 255 - value;

		// push gray pixels toward white (255)
		if (value > grayCutoff) {
			value = 255;
		}

		// write pixel
		pixels[i] = value;
		pixels[i + 1] = value;
		pixels[i + 2] = value;
	}

	canvasContext.putImageData(imageDataCopy, 0, 0);
}

saveButton.addEventListener('click', () => {
	canvas.toBlob((blob: Blob | null) => {
		if (!blob) {
			return;
		}

		const url: string = URL.createObjectURL(blob);

		const link: HTMLAnchorElement = document.createElement('a');

		link.href = url;
		link.download = 'inverted.png';

		link.click();

		URL.revokeObjectURL(url);
	}, 'image/png');
});

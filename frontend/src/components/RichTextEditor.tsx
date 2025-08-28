'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
	ssr: false,
	loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-md"></div>
});

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	error?: string;
	disabled?: boolean;
	readOnly?: boolean;
	height?: number;
	maxLength?: number;
	showToolbar?: boolean;
	className?: string;
}

// Custom KaTeX formula handler
const katexHandler = () => {
	const input = prompt('Enter LaTeX formula:');
	if (input) {
		return `\\[${input}\\]`;
	}
	return '';
};

// Custom inline KaTeX formula handler
const inlineKatexHandler = () => {
	const input = prompt('Enter inline LaTeX formula:');
	if (input) {
		return `\\(${input}\\)`;
	}
	return '';
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
	value,
	onChange,
	placeholder = 'Enter text...',
	label,
	error,
	disabled = false,
	readOnly = false,
	height = 200,
	maxLength,
	showToolbar = true,
	className = ''
}) => {
	const [charCount, setCharCount] = useState(0);
	const quillRef = useRef<any>(null);

	// Quill modules configuration
	const modules = {
		toolbar: showToolbar ? {
			container: [
				[{ 'header': [1, 2, 3, false] }],
				['bold', 'italic', 'underline', 'strike'],
				[{ 'color': [] }, { 'background': [] }],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				[{ 'align': [] }],
				['link', 'image'],
				['formula', 'inline-formula'], // Custom math buttons
				['clean']
			],
			handlers: {
				'formula': katexHandler,
				'inline-formula': inlineKatexHandler
			}
		} : false,
		formula: true, // Enable KaTeX
		syntax: false,
		clipboard: {
			matchVisual: false
		}
	};

	// Quill formats configuration
	const formats = [
		'header',
		'bold', 'italic', 'underline', 'strike',
		'color', 'background',
		'list', 'bullet',
		'align',
		'link', 'image',
		'formula', 'inline-formula'
	];

	// Custom KaTeX formula button
	useEffect(() => {
		if (quillRef.current && showToolbar) {
			const toolbar = quillRef.current.getEditor().getModule('toolbar');
			
			// Add custom math buttons
			toolbar.addHandler('formula', katexHandler);
			toolbar.addHandler('inline-formula', inlineKatexHandler);
		}
	}, [showToolbar]);

	// Character count
	useEffect(() => {
		if (maxLength) {
			// Remove HTML tags for character count
			const textContent = value.replace(/<[^>]*>/g, '');
			setCharCount(textContent.length);
		}
	}, [value, maxLength]);

	const handleChange = (content: string) => {
		if (maxLength) {
			const textContent = content.replace(/<[^>]*>/g, '');
			if (textContent.length <= maxLength) {
				onChange(content);
			}
		} else {
			onChange(content);
		}
	};

	return (
		<div className={`rich-text-editor ${className}`}>
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-2">
					{label}
					{maxLength && (
						<span className="text-xs text-gray-500 ml-2">
							({charCount}/{maxLength})
						</span>
					)}
				</label>
			)}
			
			<div className={`border rounded-md ${error ? 'border-red-300' : 'border-gray-300'} ${disabled ? 'bg-gray-50' : 'bg-white'}`}>
				<ReactQuill
					ref={quillRef}
					value={value}
					onChange={handleChange}
					modules={modules}
					formats={formats}
					placeholder={placeholder}
					readOnly={readOnly || disabled}
					style={{ height: `${height}px` }}
					theme="snow"
				/>
			</div>
			
			{error && (
				<p className="mt-1 text-sm text-red-600">{error}</p>
			)}
			
			{maxLength && (
				<div className="mt-1 text-xs text-gray-500">
					{charCount >= maxLength * 0.9 && (
						<span className="text-orange-600">
							⚠️ Approaching character limit
						</span>
					)}
					{charCount >= maxLength && (
						<span className="text-red-600">
							❌ Character limit reached
						</span>
					)}
				</div>
			)}
			
			{/* Math Help Tooltip */}
			{showToolbar && (
				<div className="mt-2 text-xs text-gray-500">
					💡 Math Tips: Use the formula button (∑) for block equations or inline-formula for inline math.
					Examples: <code className="bg-gray-100 px-1 rounded">x^2 + y^2 = z^2</code>, <code className="bg-gray-100 px-1 rounded">\frac{a}{b}</code>
				</div>
			)}
		</div>
	);
};

export default RichTextEditor; 
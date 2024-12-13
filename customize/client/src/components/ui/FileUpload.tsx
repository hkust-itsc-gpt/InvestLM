import React, { useState, forwardRef } from 'react';

type FileUploadProps = {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ children, handleFileChange }, ref) => {
    const [isFileSelected, setIsFileSelected] = useState<boolean>(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(event);
      setIsFileSelected(true); 
    };

    return (
      <>
        {!isFileSelected && children}
        <input
          ref={ref}
          multiple={false}
          type="file"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </>
    );
  },
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;

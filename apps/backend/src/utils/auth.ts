import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  enteredPassword: string,
  passwordHash: string
) => {
  return await bcrypt.compare(enteredPassword, passwordHash);
};

export const parseTimeString = (timeString: string) => {
  const timeUnits = {
    d: 86400000, // 1 day in milliseconds
    h: 3600000, // 1 hour in milliseconds
    m: 60000, // 1 minute in milliseconds
    s: 1000, // 1 second in milliseconds
  };

  let totalMilliseconds = 0;
  const regex = /(\d+)([dhms])/g; // Matches number followed by a time unit

  let match;
  while ((match = regex.exec(timeString)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    totalMilliseconds += value * timeUnits[unit as keyof typeof timeUnits];
  }

  return totalMilliseconds;
};

export const getUserSelect = () => {
  return {
    ...Object.fromEntries(
      Object.entries(prisma.user.fields)
        .filter(([k]) => k !== 'passwordHash')
        .map(([k]) => [k, true])
    ),
  };
};

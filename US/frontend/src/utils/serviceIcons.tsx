import React from 'react'
import {
  Wind,
  Snowflake,
  RefreshCw,
  Hammer,
  Tv,
  Flame,
  Fan,
  Droplets,
  Radio,
  Zap,
  Wrench,
  BatteryCharging,
  Sparkles,
  HelpCircle
} from 'lucide-react'

export interface ServiceMeta {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  commonIssues: string[]
  sampleProblem: string
}

export function getServiceMeta(iconKey?: string, serviceName?: string): ServiceMeta {
  const key = (iconKey || serviceName || '').toLowerCase()

  if (key.includes('air-conditioner') || key.includes('ac')) {
    return {
      icon: Wind,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      commonIssues: ['Not Cooling', 'Gas Leakage / Refill', 'Water Dripping', 'Inverter Board Issue', 'Deep Jet Servicing'],
      sampleProblem: 'Split AC not cooling properly and making buzzing noise'
    }
  }

  if (key.includes('refrigerator') || key.includes('fridge')) {
    return {
      icon: Snowflake,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      commonIssues: ['Freezer Frost Buildup', 'Compressor Not Starting', 'Water Leakage Inside', 'Thermostat Failure', 'Gas Charging'],
      sampleProblem: 'Double door refrigerator lower compartment not cooling'
    }
  }

  if (key.includes('washing-machine') || key.includes('dryer') || key.includes('washer')) {
    return {
      icon: RefreshCw,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      commonIssues: ['Drum Not Spinning', 'Water Not Draining', 'Excessive Vibration / Sound', 'Door Lock Error', 'PCB Display Error'],
      sampleProblem: 'Front load washing machine showing error code and not spinning'
    }
  }

  if (key.includes('home-repair') || key.includes('normal') || key.includes('handyman')) {
    return {
      icon: Hammer,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      commonIssues: ['Door Lock & Handle Fix', 'Drill & Wall Hanging', 'Furniture Assembly', 'Minor Carpentry', 'Curtain Rod Fitting'],
      sampleProblem: 'Main door lock jammed and wall shelf installation required'
    }
  }

  if (key.includes('tv') || key.includes('television') || key.includes('led')) {
    return {
      icon: Tv,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      commonIssues: ['No Display / Black Screen', 'Sound OK No Picture', 'Backlight Replacement', 'HDMI Port Not Working', 'Motherboard Fix'],
      sampleProblem: '55-inch Smart LED TV screen is blank but sound is working'
    }
  }

  if (key.includes('water-heater') || key.includes('geyser')) {
    return {
      icon: Flame,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      commonIssues: ['Water Not Heating', 'MCB Tripping When ON', 'Tank Water Leakage', 'Thermostat Burnt', 'Coil Replacement'],
      sampleProblem: 'Instant geyser water temperature cold, power light is ON'
    }
  }

  if (key.includes('chimney') || key.includes('hob')) {
    return {
      icon: Fan,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      commonIssues: ['Low Suction Power', 'Deep Oil Degreasing', 'Motor Noise / Vibration', 'Auto-Ignition Stove Sparking', 'Burner Flame Low'],
      sampleProblem: 'Kitchen chimney suction low with heavy oil grease deposit'
    }
  }

  if (key.includes('water-purifier') || key.includes('ro')) {
    return {
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      commonIssues: ['TDS Level Too High', 'Pure Water Not Flowing', 'Motor Pump Vibrating', 'Filter Replacement', 'Continuous Waste Water'],
      sampleProblem: 'RO purifier water taste bad and filter alarm beeping'
    }
  }

  if (key.includes('microwave') || key.includes('otg')) {
    return {
      icon: Radio,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      commonIssues: ['Not Heating Food', 'Sparking Inside Cavity', 'Turntable Plate Not Turning', 'Keypad Buttons Unresponsive', 'Fuse Blown'],
      sampleProblem: 'Microwave oven timer runs but food does not heat up'
    }
  }

  if (key.includes('electrical') || key.includes('wiring')) {
    return {
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      commonIssues: ['Short Circuit & Burning Smell', 'MCB Repeated Tripping', 'Switchboard Sparking', 'Ceiling Fan Slow / Humming', 'Inverter Wiring'],
      sampleProblem: 'Hall room switchboard sparking with recurring MCB trip'
    }
  }

  if (key.includes('plumbing') || key.includes('pipe')) {
    return {
      icon: Wrench,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      commonIssues: ['Under-Sink Pipe Leakage', 'Tap Drips Continuously', 'Toilet Flush Cistern Leaking', 'Drain Blockage', 'Water Pressure Low'],
      sampleProblem: 'Bathroom concealed pipeline leaking behind tiles'
    }
  }

  if (key.includes('inverter') || key.includes('battery') || key.includes('ups')) {
    return {
      icon: BatteryCharging,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      commonIssues: ['Backup Lasts Only Minutes', 'Battery Not Charging', 'Overload Alarm Beeping', 'Acid Water Top-Up', 'Inverter PCB Board Repair'],
      sampleProblem: 'Inverter beeping continuously during power cut with 0 backup'
    }
  }

  if (key.includes('dishwasher')) {
    return {
      icon: Sparkles,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      commonIssues: ['Dishes Remain Dirty', 'Water Not Draining Out', 'Soap Dispenser Stays Closed', 'Water Leakage From Door', 'Heater Not Working'],
      sampleProblem: 'Dishwasher stops mid-cycle and leaves pool of water'
    }
  }

  if (key.includes('air-cooler') || key.includes('cooler')) {
    return {
      icon: Wind,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      commonIssues: ['Cooler Motor Burnt', 'Water Pump Not Lifting', 'Honeycomb Pad Smelling', 'Fan Blade Jammed', 'Water Tank Leakage'],
      sampleProblem: 'Desert air cooler pump not lifting water to side pads'
    }
  }

  return {
    icon: HelpCircle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    commonIssues: ['General Inspection', 'Repair & Servicing', 'Parts Replacement', 'Preventive Maintenance'],
    sampleProblem: 'Appliance inspection and maintenance required'
  }
}

